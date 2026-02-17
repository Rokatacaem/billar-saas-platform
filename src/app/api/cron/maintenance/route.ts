import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        // Authenticate Cron Request (Optional: Check Authorization header if strictly needed, 
        // buy Vercel Cron protection usually suffices if configured)
        // For now, open or basic secret check if env var exists.

        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        // 1. Find Orphan Sessions
        const orphanLogs = await prisma.usageLog.findMany({
            where: {
                endedAt: null,
                startedAt: { lt: twelveHoursAgo }
            },
            include: { table: true }
        });

        if (orphanLogs.length === 0) {
            return NextResponse.json({ message: "No orphan sessions found", closed: 0 });
        }

        let closedCount = 0;
        const now = new Date();

        // 2. Process each orphan
        for (const log of orphanLogs) {
            await prisma.$transaction(async (tx) => {
                // Close Log
                await tx.usageLog.update({
                    where: { id: log.id },
                    data: {
                        endedAt: now,
                        paymentStatus: 'PENDING' // Ensure it is pending payment
                    }
                });

                // Update Table Status
                await tx.table.update({
                    where: { id: log.tableId },
                    data: {
                        status: 'PAYMENT_PENDING'
                    }
                });

                // Create System Log
                await tx.systemLog.create({
                    data: {
                        level: 'WARN',
                        message: `Sesión huérfana cerrada automáticamente`,
                        details: {
                            usageLogId: log.id,
                            tableId: log.tableId,
                            tenantId: log.tenantId,
                            duration: Math.floor((now.getTime() - log.startedAt.getTime()) / 60000)
                        },
                        tenantId: log.tenantId
                    }
                });
            });
            closedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Closed ${closedCount} orphan sessions`,
            closed: closedCount
        });

    } catch (error) {
        console.error("Cron Error:", error);

        // Log Critical Error to SystemLog (if DB is up)
        try {
            await prisma.systemLog.create({
                data: {
                    level: 'CRITICAL',
                    message: "Fallo ejecución CRON mantenimiento",
                    details: error instanceof Error ? { error: error.message } : { error: String(error) }
                }
            });
        } catch (e) {
            // DB might be down
        }

        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
