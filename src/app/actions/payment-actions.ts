'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
        paymentStatus: usageLog.paymentStatus
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
            table: p.usageLog.table.number,
            timestamp: p.createdAt.getTime()
        }));
    } catch {
        return [];
    }
}
