'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTaxConfig, calculateTaxBreakdown } from "@/app/actions/tax-actions";
import { billingProvider } from "@/lib/billing/mock-billing-provider";

// 🧾 SII Connect: Interfaces para captura de DTE Checkout

export interface DteData {
    tipoDTE: number; // 39 (Boleta) o 33 (Factura)
    rutReceptor?: string;
    razonSocialReceptor?: string;
    giroReceptor?: string;
}

// Enhanced signature to support Member ID and DTE Checkout on closure
export async function toggleTableStatus(tableId: string, currentStatus: string, memberId?: string, dteData?: DteData) {
    try {
        // ... (auth checks remain same)
        const session = await auth();
        // ...

        if (!session?.user?.tenantId) {
            return { success: false, error: "No autorizado" };
        }
        const tenantId = session.user.tenantId;

        // ... (fetch table)
        const table = await prisma.table.findUnique({ where: { id: tableId, tenantId } });
        if (!table) throw new Error("Table not found");

        if (table.status === 'OCCUPIED') {
            // Ending session
            const now = new Date();
            let amountCharged = 0;
            let durationMinutes = 0;
            let discountApplied = 0;

            if (table.currentSessionId) {
                const usageLog = await prisma.usageLog.findUnique({
                    where: { id: table.currentSessionId }
                });

                if (usageLog) {
                    durationMinutes = Math.max(0, Math.floor((now.getTime() - usageLog.startedAt.getTime()) / 60000));

                    // Fetch Tenant Config (base rate + tax)
                    const tenant = await prisma.tenant.findUnique({
                        where: { id: tenantId },
                        select: { baseRate: true, taxRate: true, taxName: true, isTaxExempt: true }
                    });

                    // 🛡️ PRECISION: (Minutes / 60) * HourlyRate 🎯
                    const hourlyRate = tenant?.baseRate || 0;
                    let timeCharge = (durationMinutes / 60) * hourlyRate;

                    // Apply Member Discount to Time Charge
                    if (memberId) {
                        const member = await prisma.member.findUnique({
                            where: { id: memberId, tenantId }
                        });
                        // 🛡️ HITO 2: Solo aplicar descuento si el socio está AL DÍA con su suscripción
                        if (member && member.subscriptionStatus === 'ACTIVE' && member.discount > 0) {
                            const discountAmount = timeCharge * (member.discount / 100);
                            timeCharge -= discountAmount;
                            discountApplied = discountAmount;
                        }
                    }

                    // Calculate Product Total
                    const orderItems = await prisma.orderItem.findMany({
                        where: { usageLogId: table.currentSessionId }
                    });
                    const productTotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

                    // Grand Total (pre-tax)
                    const subtotal = Number((timeCharge + productTotal).toFixed(2));

                    // ─── Tax Breakdown (Sentinel-validated) ───────────────────────
                    const taxConfig = await getTaxConfig(tenantId);
                    const taxBreakdown = await calculateTaxBreakdown(subtotal, taxConfig.rate);
                    amountCharged = taxBreakdown.grossAmount;

                    const tipoDTE = dteData?.tipoDTE || 39;

                    // 🚀 SII Connect: Emisión a través de Provider
                    const dtRes = await billingProvider.emitDocument({
                        tenantId,
                        tipoDTE,
                        montoNeto: taxBreakdown.netAmount,
                        montoIva: taxBreakdown.taxAmount,
                        montoTotal: taxBreakdown.grossAmount,
                        receptor: dteData?.rutReceptor ? {
                            rut: dteData.rutReceptor,
                            razonSocial: dteData.razonSocialReceptor || '',
                            giro: dteData.giroReceptor || ''
                        } : undefined
                    });

                    // Close UsageLog (incluye desglose fiscal)
                    await prisma.usageLog.update({
                        where: { id: table.currentSessionId },
                        data: {
                            endedAt: now,
                            durationMinutes,
                            amountCharged,
                            memberId,
                            discountApplied,
                            taxAmount: taxBreakdown.taxAmount,
                            taxRate: taxConfig.rate,
                            taxName: taxConfig.name,

                            // 📄 DTE Info (SII Connect Checkout)
                            tipoDTE,
                            rutReceptor: dteData?.rutReceptor,
                            razonSocialReceptor: dteData?.razonSocialReceptor,
                            giroReceptor: dteData?.giroReceptor,
                            folioDTE: dtRes.folio,
                            dteStatus: dtRes.status
                        }
                    });

                    // Update Table Status and Play Hours
                    const durationHours = durationMinutes / 60;
                    await prisma.table.update({
                        where: { id: tableId, tenantId },
                        data: {
                            status: 'CLEANING',
                            totalPlayHours: { increment: durationHours }
                        }
                    });

                    // 🛡️ SENTINEL: Alerta de mantenimiento si se supera el umbral
                    if (table.totalPlayHours + durationHours >= (table.maintenanceThreshold || 100)) {
                        await prisma.systemLog.create({
                            data: {
                                level: 'WARN',
                                message: `Mantenimiento Requerido: Mesa ${table.number} alcanzó ${Number((table.totalPlayHours + durationHours).toFixed(1))} horas de uso.`,
                                tenantId
                            }
                        });
                    }

                    revalidatePath(`/tenant/[slug]`);
                    return { success: true, status: 'CLEANING' };
                }
            } else {
                // Fallback if no session found but table was OCCUPIED
                await prisma.table.update({
                    where: { id: tableId, tenantId },
                    data: { status: 'AVAILABLE', currentSessionId: null }
                });
                return { success: true, status: 'AVAILABLE' };
            }
        } else if (table.status === 'CLEANING') {
            // After cleaning, table becomes AVAILABLE
            await prisma.table.update({
                where: { id: tableId, tenantId },
                data: { status: 'AVAILABLE', currentSessionId: null, lastSessionStart: null }
            });
            revalidatePath(`/tenant/[slug]`);
            return { success: true, status: 'AVAILABLE' };
        } else if (table.status === 'AVAILABLE' || table.status === 'PAYMENT_PENDING') {
            // Starting session (Allow starting even if PAYMENT_PENDING? Maybe force close? Let's assume start resets)
            // If starting new session on PAYMENT_PENDING, we assume previous is abandoned or paid externally?
            // Safer to just allow simple toggle for now.

            const now = new Date();
            // ... create new log
            const newLog = await prisma.usageLog.create({
                data: {
                    tenantId,
                    tableId,
                    startedAt: now,
                }
            });

            await prisma.table.update({
                where: { id: tableId, tenantId },
                data: {
                    status: 'OCCUPIED',
                    lastSessionStart: now,
                    currentSessionId: newLog.id
                }
            });

            revalidatePath(`/tenant/[slug]`);
            return { success: true, status: 'OCCUPIED' };
        }

        return { success: false, error: "Estado desconocido" };
    } catch (error) {
        console.error("Server Action Error (toggleTableStatus):", error);
        throw error; // Re-throw to be caught by the client
    }
}

/**
 * 🛡️ SENTINEL: Auditoría de Sesiones Huérfanas
 * Detecta mesas marcadas como OCCUPIED que no tienen una sesión real abierta
 * o que llevan más de 12 horas sin actividad.
 */
export async function auditOrphanSessions(tenantId: string) {
    try {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        // Buscar inconsistencias
        const orphanTables = await prisma.table.findMany({
            where: {
                tenantId,
                status: 'OCCUPIED',
                OR: [
                    { currentSessionId: null },
                    { lastSessionStart: { lt: twelveHoursAgo } }
                ]
            }
        });

        if (orphanTables.length === 0) return { success: true, fixed: 0 };

        // Reparar automáticamente: Pasar a AVAILABLE
        const ids = orphanTables.map(t => t.id);
        await prisma.table.updateMany({
            where: { id: { in: ids } },
            data: {
                status: 'AVAILABLE',
                currentSessionId: null,
                lastSessionStart: null
            }
        });

        return { success: true, fixed: ids.length, names: orphanTables.map(t => t.number) };

    } catch (error) {
        console.error("Sentinel Error (auditOrphanSessions):", error);
        return { success: false, error: "Error en auditoría" };
    }
}

/**
 * 🧾 POS: Registro de Pago
 * Registra el pago manual de una sesión y la marca como pagada.
 */
export async function registerPayment(usageLogId: string, amount: number, method: 'CASH' | 'CARD' | 'TRANSFER', tenantId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create Payment Record
            await tx.paymentRecord.create({
                data: {
                    amount,
                    method,
                    status: 'COMPLETED',
                    provider: 'CASHIER', // Manual entry
                    usageLogId,
                    tenantId
                }
            });

            // 2. Update Usage Log
            await tx.usageLog.update({
                where: { id: usageLogId },
                data: { paymentStatus: 'PAID' }
            });
        });

        revalidatePath(`/tenant/[slug]`);
        return { success: true };
    } catch (error) {
        console.error("Error registering payment:", error);
        return { success: false, error: "Error al registrar pago" };
    }
}

/**
 * 🎫 Akapoolco: Datos de Ticket Rápido
 * Obtiene todos los detalles de una sesión para generar un comprobante/ticket.
 */
export async function getQuickTicketData(usageLogId: string) {
    try {
        const log = await prisma.usageLog.findUnique({
            where: { id: usageLogId },
            include: {
                table: true,
                member: true,
                items: {
                    include: { product: true }
                }
            }
        });

        if (!log) return null;

        // Estructura simplificada para el ticket
        return {
            folio: log.id.slice(-6).toUpperCase(),
            mesa: log.table.number,
            inicio: log.startedAt,
            fin: log.endedAt,
            duracion: log.durationMinutes,
            socio: log.member?.name || 'Cliente General',
            consumo: log.items.map(i => ({
                cant: i.quantity,
                desc: i.product.name,
                total: i.totalPrice
            })),
            totalTiempo: log.amountCharged - log.items.reduce((s, i) => s + i.totalPrice, 0) + log.discountApplied,
            descuento: log.discountApplied,
            granTotal: log.amountCharged,
            pagado: log.paymentStatus === 'PAID'
        };
    } catch (error) {
        console.error("Error getting ticket data:", error);
        return null;
    }
}
