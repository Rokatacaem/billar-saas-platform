'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { revalidatePath } from "next/cache";

export async function getDashboardStats(range: 'today' | '7days' | 'month' = 'today') {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') throw new Error("Unauthorized");
    const tenantId = session.user.tenantId;

    // 0. Get Tenant Timezone (Placeholder for future strict timezone math)
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { timezone: true }
    });
    // const timezone = tenant?.timezone || 'America/Santiago';

    let startDate = startOfDay(new Date());
    let endDate = endOfDay(new Date());

    if (range === '7days') {
        startDate = startOfDay(subDays(new Date(), 7));
    } else if (range === 'month') {
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
    }

    // TODO: Implement strict timezone start/end using `date-fns-tz` when available.
    // Currently using Server Time (UTC).

    // 1. Fetch UsageLogs within range
    const logs = await prisma.usageLog.findMany({
        where: {
            tenantId,
            startedAt: { gte: startDate, lte: endDate },
            endedAt: { not: null } // Only closed sessions count for revenue stats
        },
        include: { items: true }
    });

    // 2. Calculate Totals
    let totalRevenue = 0;
    let timeRevenue = 0;
    let productRevenue = 0;
    let totalSessions = logs.length;

    // Use amountCharged if available (for precise historical data), 
    // but for aggregation we can also recalculate to be sure if needed. 
    // Let's rely on amountCharged as it is the "billed" amount.
    // However, amountCharged might not be split by Time vs Product easily without items.
    // Actually, we can get product revenue from items and deduce time revenue.

    for (const log of logs) {
        let pRev = 0;
        if (log.items) {
            pRev = log.items.reduce((sum, item) => sum + item.totalPrice, 0);
        }
        productRevenue += pRev;
        // If amountCharged exists, use it. Else fall back? 
        // We implemented amountCharged previously.
        const charged = log.amountCharged || 0;
        totalRevenue += charged;
        timeRevenue += (charged - pRev); // Implicitly time revenue
    }

    // Fix floating point issues
    totalRevenue = parseFloat(totalRevenue.toFixed(2));
    timeRevenue = parseFloat(timeRevenue.toFixed(2));
    productRevenue = parseFloat(productRevenue.toFixed(2));

    // 3. Active Tables
    const activeTablesCount = await prisma.table.count({
        where: { tenantId, status: 'OCCUPIED' }
    });

    // 4. RevPTH (Revenue Per Table Hour)
    // Approximate: Total Revenue / (Total Duration Minutes / 60)
    // Only counts closed sessions duration
    const totalDurationMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
    const totalHours = totalDurationMinutes / 60;
    const revPTH = totalHours > 0 ? (totalRevenue / totalHours) : 0;

    return {
        totalRevenue,
        timeRevenue,
        productRevenue,
        activeTablesCount,
        totalSessions,
        revPTH: parseFloat(revPTH.toFixed(2)),
        period: { start: startDate, end: endDate }
    };
}

export async function getRevenueChartData(range: 'today' | '7days' | 'month' = 'today') {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("Unauthorized");
    const tenantId = session.user.tenantId;

    // Grouping by Date for Chart
    // This is complex with just Prisma. 
    // Easiest way: Fetch all logs in range and group in JS (given reasonable data size for MVP).

    // Re-use logic or call similar query
    // Let's implement a simple "Last 7 Days" view for now if range is today/7days
    // If range is today, maybe hourly?

    // Grouping Logic:
    // If Today: Group by Hour.
    // If 7Days/Month: Group by Day.

    let startDate = startOfDay(new Date());
    let endDate = endOfDay(new Date());
    let dateFormat = 'HH:00'; // Hourly

    if (range === '7days') {
        startDate = subDays(startOfDay(new Date()), 6); // Last 7 days inc today
        dateFormat = 'dd/MM';
    } else if (range === 'month') {
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        dateFormat = 'dd/MM';
    }

    const logs = await prisma.usageLog.findMany({
        where: {
            tenantId,
            startedAt: { gte: startDate, lte: endDate },
        },
        orderBy: { startedAt: 'asc' }
    });

    const dataMap = new Map<string, { time: number, product: number }>();

    for (const log of logs) {
        const key = format(log.startedAt, dateFormat);
        if (!dataMap.has(key)) dataMap.set(key, { time: 0, product: 0 });

        const entry = dataMap.get(key)!;
        const charged = log.amountCharged || 0;

        // Need to split product vs time. 
        // For efficiency, maybe we assume a ratio or fetch items? 
        // Let's fetch products to be accurate. 
        // Note: findMany logic above needs include: { items: true } to work here.
    }

    // Refetch with items for accuracy
    const logsWithItems = await prisma.usageLog.findMany({
        where: {
            tenantId,
            startedAt: { gte: startDate, lte: endDate },
        },
        include: { items: true },
        orderBy: { startedAt: 'asc' }
    });

    for (const log of logsWithItems) {
        const key = format(log.startedAt, dateFormat);
        if (!dataMap.has(key)) dataMap.set(key, { time: 0, product: 0 });

        const entry = dataMap.get(key)!;
        const pRev = log.items.reduce((sum, i) => sum + i.totalPrice, 0);
        const total = log.amountCharged || 0;

        entry.product += pRev;
        entry.time += (total - pRev);
    }

    // Convert Map to Array
    const chartData = Array.from(dataMap.entries()).map(([name, val]) => ({
        name,
        time: parseFloat(val.time.toFixed(2)),
        product: parseFloat(val.product.toFixed(2))
    }));

    return chartData;
}

export async function closeDailyCash() {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') throw new Error("Unauthorized");
    const tenantId = session.user.tenantId;
    const userId = session.user.id || 'system';

    // 1. Find Open (Unaudited) Logs ending before NOW
    // Only logs that are CLOSED (endedAt != null) but not yet part of a DailyBalance
    const unauditedLogs = await prisma.usageLog.findMany({
        where: {
            tenantId,
            endedAt: { not: null },
            dailyBalanceId: null
        },
        include: { items: true }
    });

    if (unauditedLogs.length === 0) {
        return { success: false, message: "No unaudited records found to close." };
    }

    // 2. Calculate Totals
    let totalRevenue = 0;
    let timeRevenue = 0;
    let productRevenue = 0;

    for (const log of unauditedLogs) {
        const pRev = log.items.reduce((sum, i) => sum + i.totalPrice, 0);
        const total = log.amountCharged || 0;
        productRevenue += pRev;
        timeRevenue += (total - pRev);
        totalRevenue += total;
    }

    // 3. Create DailyBalance and Update Logs Transactionally
    // Note: Implicitly "Today's Closure" or "Current Shift Closure"
    try {
        const result = await prisma.$transaction(async (tx) => {
            const balance = await tx.dailyBalance.create({
                data: {
                    tenantId,
                    closedBy: userId,
                    totalRevenue,
                    timeRevenue,
                    productRevenue,
                    date: new Date()
                }
            });

            // Associate logs
            const logIds = unauditedLogs.map(l => l.id);
            await tx.usageLog.updateMany({
                where: { id: { in: logIds } },
                data: { dailyBalanceId: balance.id }
            });

            return balance;
        });

        revalidatePath(`/tenant/[slug]/admin/reports`);
        return { success: true, balanceId: result.id };

    } catch (error) {
        console.error("Cash Closure Error:", error);
        return { success: false, error: "Failed to close cash register." };
    }
}
