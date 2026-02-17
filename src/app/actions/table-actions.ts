'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Enhanced signature to support Member ID on closure
export async function toggleTableStatus(tableId: string, currentStatus: string, memberId?: string) {
    try {
        // ... (auth checks remain same)
        const session = await auth();

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

                    // Fetch Tenant Base Rate
                    const tenant = await prisma.tenant.findUnique({
                        where: { id: tenantId },
                        select: { baseRate: true }
                    });
                    const rate = tenant?.baseRate || 0;
                    let timeCharge = durationMinutes * rate;

                    // Apply Member Discount to Time Charge
                    if (memberId) {
                        const member = await prisma.member.findUnique({
                            where: { id: memberId, tenantId }
                        });
                        if (member && member.discount > 0) {
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

                    // Grand Total
                    amountCharged = timeCharge + productTotal;

                    // Close UsageLog
                    await prisma.usageLog.update({
                        where: { id: table.currentSessionId },
                        data: {
                            endedAt: now,
                            durationMinutes,
                            amountCharged,
                            memberId, // Link Member
                            discountApplied
                        }
                    });

                    // Update Table Status to PAYMENT_PENDING
                    await prisma.table.update({
                        where: { id: tableId, tenantId },
                        data: {
                            status: 'PAYMENT_PENDING',
                            // Keep currentSessionId linked for payment
                        }
                    });

                    revalidatePath(`/tenant/[slug]`);
                    return { success: true, status: 'PAYMENT_PENDING' };
                }
            } else {
                // Fallback if no session found but table was OCCUPIED
                await prisma.table.update({
                    where: { id: tableId, tenantId },
                    data: { status: 'AVAILABLE', currentSessionId: null }
                });
                return { success: true, status: 'AVAILABLE' };
            }
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
