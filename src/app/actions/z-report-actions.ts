'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

/**
 * 📊 Z-REPORT: Cierre de Turno con Consolidación Maestro
 *
 * Implementa el "Arqueo Ciego": el cajero ingresa el efectivo real
 * ANTES de que el sistema muestre el monto teórico. Sentinel registra
 * automáticamente cualquier descuadre significativo.
 */
export async function closeShift(data: {
    cashInHand: number; // Efectivo contado por el cajero (Arqueo Ciego)
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    const tenantId = session.user.tenantId;
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    try {
        return await prisma.$transaction(async (tx) => {

            // ─── 1. Sesiones cerradas pendientes de consolidar ────────────
            const openLogs = await tx.usageLog.findMany({
                where: {
                    tenantId,
                    endedAt: { not: null },
                    dailyBalanceId: null
                },
                include: {
                    items: {
                        include: { product: true }
                    },
                    paymentRecords: true
                }
            });

            if (openLogs.length === 0) {
                return { success: false, error: "No hay sesiones cerradas pendientes de consolidar." };
            }

            // ─── 2. Revenue Streams ───────────────────────────────────────
            let timeRevenue = 0;
            let productRevenue = 0;
            let totalCost = 0;
            let cashRevenue = 0;
            let cardRevenue = 0;
            let creditRevenue = 0;

            for (const log of openLogs) {
                timeRevenue += log.amountCharged;

                for (const item of log.items) {
                    productRevenue += item.totalPrice;
                    totalCost += (item.product.costPrice || 0) * item.quantity;
                }

                // Desglose por método de pago
                for (const payment of log.paymentRecords) {
                    if (payment.status !== 'COMPLETED') continue;
                    const method = payment.method?.toUpperCase();
                    if (method === 'CASH') cashRevenue += payment.amount;
                    else if (method === 'CARD' || method === 'TRANSFER') cardRevenue += payment.amount;
                    else creditRevenue += payment.amount;
                }
            }

            const totalRevenue = timeRevenue + productRevenue;

            // ─── 3. Mermas del turno ──────────────────────────────────────
            const wasteMovements = await tx.stockMovement.findMany({
                where: {
                    tenantId,
                    type: 'MERMA',
                    createdAt: { gte: startOfDay }
                },
                include: { product: true }
            });

            const wasteCost = wasteMovements.reduce((sum: number, m: { quantity: number; product: { costPrice: number } }) => {
                return sum + (Math.abs(m.quantity) * (m.product.costPrice || 0));
            }, 0);

            // ─── 4. Mantenimiento del turno (SQL raw para compatibilidad) ──
            const maintRows = await tx.$queryRaw<{ cost: number }[]>`
                SELECT "cost" FROM "MaintenanceLog"
                WHERE "tenantId" = ${tenantId}
                AND "createdAt" >= ${startOfDay}
            `;
            const maintenanceCost = maintRows.reduce((sum: number, m: { cost: number }) => sum + (Number(m.cost) || 0), 0);

            // ─── 5. Utilidad Neta ─────────────────────────────────────────
            const netProfit = totalRevenue - totalCost - wasteCost - maintenanceCost;

            // ─── 6. Arqueo Ciego (Sentinel) ───────────────────────────────
            const cashDifference = data.cashInHand - cashRevenue;
            const TOLERANCE = 500;
            const hasCashAlert = Math.abs(cashDifference) > TOLERANCE;

            // ─── 7. Crear Registro Inmutable ──────────────────────────────
            // Usamos Prisma.sql para asegurar compatibilidad con campos nuevos
            const balanceRecord = await tx.$queryRaw<{ id: string }[]>`
                INSERT INTO "DailyBalance" (
                    "id", "date", "tenantId", "closedBy", "notes", "status",
                    "totalRevenue", "timeRevenue", "productRevenue", "membershipRevenue", "rentalRevenue",
                    "cashRevenue", "cardRevenue", "creditRevenue",
                    "totalCost", "wasteCost", "maintenanceCost", "netProfit",
                    "cashInHand", "cashDifference", "hasCashAlert",
                    "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid()::text,
                    ${now},
                    ${tenantId},
                    ${session.user.name || session.user.email || 'Unknown'},
                    ${data.notes || null},
                    'CLOSED',
                    ${totalRevenue}, ${timeRevenue}, ${productRevenue}, ${0}, ${0},
                    ${cashRevenue}, ${cardRevenue}, ${creditRevenue},
                    ${totalCost}, ${wasteCost}, ${maintenanceCost}, ${netProfit},
                    ${data.cashInHand}, ${cashDifference}, ${hasCashAlert},
                    NOW(), NOW()
                )
                RETURNING "id"
            `;

            const balanceId = balanceRecord[0]?.id;
            if (!balanceId) throw new Error("No se pudo crear el DailyBalance");

            // ─── 8. Vincular Logs al Balance ──────────────────────────────
            await tx.usageLog.updateMany({
                where: { id: { in: openLogs.map(l => l.id) } },
                data: { dailyBalanceId: balanceId }
            });

            // ─── 9. Bandera Roja Sentinel ─────────────────────────────────
            if (hasCashAlert) {
                await tx.systemLog.create({
                    data: {
                        level: 'WARN',
                        message: `🚩 Descuadre de Caja Z-Report: ${cashDifference > 0 ? 'Sobran' : 'Faltan'} ${Math.abs(cashDifference).toFixed(0)} unidades. Teórico: ${cashRevenue.toFixed(0)} | Declarado: ${data.cashInHand}`,
                        tenantId,
                        details: {
                            balanceId,
                            theoretical: cashRevenue,
                            declared: data.cashInHand,
                            difference: cashDifference,
                            closedBy: session.user.email
                        } as Prisma.InputJsonValue
                    }
                });
            }

            return {
                success: true,
                balanceId,
                hasCashAlert,
                cashDifference,
                summary: {
                    totalRevenue,
                    netProfit,
                    sessionCount: openLogs.length
                }
            };
        });

    } catch (error) {
        console.error("Error in closeShift:", error);
        return { success: false, error: "Error al procesar el cierre Z" };
    }
}

/**
 * 📈 Z-REPORT: Historial de Balances con resumen
 */
export async function getDailyBalances() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("Unauthorized");

    return prisma.dailyBalance.findMany({
        where: { tenantId: session.user.tenantId },
        include: {
            _count: { select: { usageLogs: true } }
        },
        orderBy: { date: 'desc' },
        take: 30
    });
}

/**
 * 📋 Z-REPORT: Detalle completo de un balance histórico
 */
export async function getZReportDetail(balanceId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("Unauthorized");

    return prisma.dailyBalance.findUnique({
        where: {
            id: balanceId,
            tenantId: session.user.tenantId
        },
        include: {
            usageLogs: {
                include: {
                    table: { select: { number: true } },
                    items: {
                        include: { product: { select: { name: true, costPrice: true } } }
                    },
                    paymentRecords: true
                },
                orderBy: { endedAt: 'desc' }
            }
        }
    });
}
