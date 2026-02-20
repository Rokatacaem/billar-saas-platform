'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { paymentProvider } from '@/lib/payments/mock-payment-provider';
import { auth } from '@/auth';

export async function initiatePayment(usageLogId: string, tenantId: string) {
    try {
        const usageLog = await prisma.usageLog.findUnique({
            where: { id: usageLogId },
            include: { items: true, table: true }
        });

        if (!usageLog || usageLog.tenantId !== tenantId) {
            return { success: false, error: "Sesión no encontrada" };
        }

        if (usageLog.paymentStatus === 'PAID') {
            return { success: false, error: "Ya pagado" };
        }

        // Mock Payment Intent ID
        const paymentIntentId = `pi_${Math.random().toString(36).substring(7)}`;

        return { success: true, paymentIntentId, amount: usageLog.amountCharged };
    } catch (error) {
        console.error("Error initiating payment:", error);
        return { success: false, error: "Error de servidor" };
    }
}

export async function confirmPayment(usageLogId: string, tenantId: string, method: string = 'CARD') {
    try {
        const usageLog = await prisma.usageLog.findUnique({
            where: { id: usageLogId }
        });

        if (!usageLog || usageLog.tenantId !== tenantId) throw new Error("Invalid Session");

        // Transactional Update
        await prisma.$transaction(async (tx) => {
            // 1. Create Payment Record
            await tx.paymentRecord.create({
                data: {
                    amount: usageLog.amountCharged,
                    method,
                    status: 'COMPLETED',
                    provider: 'MOCK_GATEWAY',
                    transactionId: `tx-${Date.now()}`,
                    usageLogId,
                    tenantId
                }
            });

            // 2. Update Usage Log
            await tx.usageLog.update({
                where: { id: usageLogId },
                data: { paymentStatus: 'PAID' }
            });

            // 3. Free Table if it's still occupied by this session (Optional logic, usually done by waiter closing session first)
            // But here we assume payment makes it fully closed if it wasn't.
            // If the table status is 'OCCUPIED' and currentSessionId is this one, we might want to ensure it's free?
            // Usually payment happens AFTER session close (status=OCCUPIED -> Summary -> Pay).
            // So table might be waiting for payment. 
            // Let's just ensure the log is marked PAID. Logic to free table might be separate or triggered here.

            // If we want to Release Table automatically upon payment:
            const table = await tx.table.findFirst({
                where: { currentSessionId: usageLogId }
            });

            if (table) {
                await tx.table.update({
                    where: { id: table.id },
                    data: {
                        status: 'AVAILABLE',
                        currentSessionId: null,
                        lastSessionStart: null
                    }
                });
            }
        });

        revalidatePath(`/tenant/${tenantId}`);
        return { success: true };
    } catch (error) {
        console.error("Error confirming payment:", error);
        // Log to SystemLog
        try {
            await prisma.systemLog.create({
                data: {
                    level: 'ERROR',
                    message: `Fallo confirmación pago para UsageLog ${usageLogId}`,
                    details: error instanceof Error ? { error: error.message } : { error: String(error) },
                    tenantId
                }
            });
        } catch (e) { /* Fail silently if DB is down */ }

        return { success: false, error: "Error procesando pago" };
    }
}

export async function getReceiptData(usageLogId: string) {
    const usageLog = await prisma.usageLog.findUnique({
        where: { id: usageLogId },
        include: {
            tenant: true,
            items: { include: { product: true } },
            member: true,
            table: true // Include table to show table number
        }
    });

    if (!usageLog) return null;

    return {
        tenantName: usageLog.tenant.name,
        tenantAddress: "Dirección del Club", // Placeholder or field from tenant settings
        date: usageLog.endedAt || new Date(),
        tableNumber: usageLog.table.number,
        items: usageLog.items.map(i => ({
            description: i.product.name,
            quantity: i.quantity,
            total: i.totalPrice
        })),
        durationMinutes: usageLog.durationMinutes,
        timeCharge: (usageLog.amountCharged - usageLog.items.reduce((acc, i) => acc + i.totalPrice, 0)) + (usageLog.discountApplied || 0),
        discount: usageLog.discountApplied,
        total: usageLog.amountCharged,
        memberName: usageLog.member?.name,
        paymentStatus: usageLog.paymentStatus,
        taxDetails: {
            rate: usageLog.taxRate || usageLog.tenant.taxRate || 0,
            name: usageLog.taxName || usageLog.tenant.taxName || 'IVA',
            // taxAmount guardado al cerrar sesión (neto × taxRate)
            amount: usageLog.taxAmount || 0,
        }
    };
}

export async function checkNewPayments(tenantId: string, since: number) {
    try {
        const sinceDate = new Date(since);
        const payments = await prisma.paymentRecord.findMany({
            where: {
                tenantId,
                createdAt: { gt: sinceDate },
                status: 'COMPLETED'
            },
            include: { usageLog: { include: { table: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        return payments.map(p => ({
            id: p.id,
            amount: p.amount,
            table: p.usageLog?.table?.number ?? 0,
            timestamp: p.createdAt.getTime()
        }));
    } catch {
        return [];
    }
}

/**
 * Inicia el proceso de Checkout de Membresía usando un Payment Provider
 */
export async function createMemberCheckoutSession(memberId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'No autorizado' };

    const tenantId = session.user.tenantId;

    try {
        const member = await prisma.member.findUnique({
            where: { id: memberId, tenantId },
            include: { membershipPlan: true }
        });

        if (!member) return { success: false, error: 'Socio no encontrado' };
        if (!member.membershipPlan) return { success: false, error: 'Socio no tiene plan asignado' };

        const plan = member.membershipPlan;

        // 1. Crear el Registro de Pago Pendiente
        const pendingPayment = await prisma.membershipPayment.create({
            data: {
                tenantId,
                memberId: member.id,
                amount: plan.price,
                status: 'PENDING',
                dteType: plan.isTaxable ? 39 : 41,
            }
        });

        // 2. Generar el Link de Pago en la Pasarela
        const intentResponse = await paymentProvider.createPaymentIntent({
            tenantId,
            amount: plan.price,
            referenceId: `MEM_${pendingPayment.id}`,
            description: `Plan de Membresía ${plan.name} - ${member.name}`,
            customerEmail: member.email || undefined
        });

        if (!intentResponse.success) {
            return { success: false, error: 'Fallo al iniciar sesión de pago' };
        }

        // 3. Vincular el PaymentIntentID al registro local
        await prisma.membershipPayment.update({
            where: { id: pendingPayment.id },
            data: { transactionId: intentResponse.transactionId }
        });

        return { success: true, paymentUrl: intentResponse.paymentUrl };

    } catch (error) {
        console.error("Error creating member checkout session:", error);
        return { success: false, error: 'Error del sistema de pagos' };
    }
}

/**
 * Inicia el proceso de Checkout QR de una Mesa Activa
 */
export async function createTableCheckoutSession(tableId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'No autorizado' };

    const tenantId = session.user.tenantId;

    try {
        const table = await prisma.table.findUnique({
            where: { id: tableId, tenantId }
        });

        if (!table || !table.currentSessionId) {
            return { success: false, error: 'Mesa Inactiva / No Encontrada' };
        }

        const usageLog = await prisma.usageLog.findUnique({
            where: { id: table.currentSessionId }
        });

        if (!usageLog) return { success: false, error: 'Sesión corrompida' };

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const ratePerHour = tenant?.baseRate || 0;

        const now = new Date();
        const durationMs = now.getTime() - usageLog.startedAt.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const timeCharge = Number((durationHours * ratePerHour).toFixed(2));

        const totalToPay = timeCharge;

        if (totalToPay <= 0) return { success: false, error: 'El saldo pendiente es $0' };

        // Generar QR en Pasarela
        const intentResponse = await paymentProvider.createPaymentIntent({
            tenantId,
            amount: totalToPay,
            referenceId: `TAB_${table.currentSessionId}`,
            description: `Liquidación Mesa ${table.number}`,
        });

        if (!intentResponse.success) {
            return { success: false, error: 'Fallo pasarela de pagos' };
        }

        return { success: true, paymentUrl: intentResponse.paymentUrl };

    } catch (error) {
        console.error("Table qr error:", error);
        return { success: false, error: 'Error general al generar QR' };
    }
}
