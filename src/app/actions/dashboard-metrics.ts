'use server';

import { prisma } from "@/lib/prisma";

/**
 * 🏛️ CLUB SOCIOS DASHBOARD METRICS
 */

/**
 * Get membership status breakdown
 */
export async function getClubMembershipMetrics(tenantId: string) {
    try {
        const members = await prisma.member.findMany({
            where: { tenantId, category: 'SOCIO' }
        });

        const active = members.filter(m => m.subscriptionStatus === 'ACTIVE').length;
        const expired = members.filter(m => m.subscriptionStatus === 'CANCELLED').length;
        const pending = members.filter(m => m.subscriptionStatus === 'IN_ARREARS').length;
        const total = members.length;

        return {
            success: true,
            metrics: {
                total,
                active,
                expired,
                pending,
                activePercentage: total > 0 ? (active / total) * 100 : 0,
                churnRate: total > 0 ? (expired / total) * 100 : 0
            }
        };
    } catch (error) {
        console.error('[getClubMembershipMetrics] Error:', error);
        return { success: false, error: 'Database error', metrics: null };
    }
}

/**
 * Get members with expiring memberships (next 5 days)
 */
export async function getMembersWithExpiringMemberships(tenantId: string, daysAhead: number = 5) {
    try {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const expiringMembers = await prisma.member.findMany({
            where: {
                tenantId,
                category: 'SOCIO',
                currentPeriodEnd: {
                    gte: now,
                    lte: futureDate
                }
            },
            orderBy: { currentPeriodEnd: 'asc' }
        });

        return {
            success: true,
            members: expiringMembers
        };
    } catch (error) {
        console.error('[getMembersWithExpiringMemberships] Error:', error);
        return { success: false, error: 'Database error', members: [] };
    }
}

/**
 * Get member attendance frequency (visits per month)
 */
export async function getMemberAttendanceFrequency(tenantId: string) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get all SOCIO members
        const members = await prisma.member.findMany({
            where: { tenantId, category: 'SOCIO' },
            include: {
                usageLogs: {
                    where: {
                        startedAt: { gte: thirtyDaysAgo }
                    }
                }
            }
        });

        const attendanceData = members.map(member => ({
            id: member.id,
            name: member.name,
            visitsLast30Days: member.usageLogs.length,
            averageVisitsPerMonth: member.usageLogs.length,
            status: member.subscriptionStatus
        }));

        // Sort by visits descending
        attendanceData.sort((a, b) => b.visitsLast30Days - a.visitsLast30Days);

        const avgFrequency = attendanceData.length > 0
            ? attendanceData.reduce((sum, m) => sum + m.visitsLast30Days, 0) / attendanceData.length
            : 0;

        return {
            success: true,
            data: attendanceData,
            averageFrequency: avgFrequency
        };
    } catch (error) {
        console.error('[getMemberAttendanceFrequency] Error:', error);
        return { success: false, error: 'Database error', data: [], averageFrequency: 0 };
    }
}

/**
 * 💼 COMERCIAL DASHBOARD METRICS
 */

/**
 * Calculate Revenue Per Table Hour (RevPTH)
 */
export async function getRevenuePeTH(tenantId: string, days: number = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const usageLogs = await prisma.usageLog.findMany({
            where: {
                tenantId,
                endedAt: { gte: startDate },
                paymentStatus: 'PAID'
            },
            include: { table: true }
        });

        if (usageLogs.length === 0) {
            return {
                success: true,
                revPTH: 0,
                totalRevenue: 0,
                totalHours: 0
            };
        }

        const totalRevenue = usageLogs.reduce((sum, log) => sum + log.amountCharged, 0);
        const totalMinutes = usageLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
        const totalHours = totalMinutes / 60;

        const revPTH = totalHours > 0 ? totalRevenue / totalHours : 0;

        return {
            success: true,
            revPTH,
            totalRevenue,
            totalHours
        };
    } catch (error) {
        console.error('[getRevenuePeTH] Error:', error);
        return { success: false, error: 'Database error', revPTH: 0, totalRevenue: 0, totalHours: 0 };
    }
}

/**
 * Get sales mix (Time Revenue vs Product Revenue)
 */
export async function getSalesMix(tenantId: string, days: number = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const usageLogs = await prisma.usageLog.findMany({
            where: {
                tenantId,
                endedAt: { gte: startDate },
                paymentStatus: 'PAID'
            },
            include: { items: true }
        });

        let timeRevenue = 0;
        let productRevenue = 0;

        usageLogs.forEach(log => {
            const itemsTotal = log.items.reduce((sum, item) => sum + item.totalPrice, 0);
            productRevenue += itemsTotal;

            // Time revenue = total - products - discount
            const timeCharge = log.amountCharged - itemsTotal;
            timeRevenue += Math.max(0, timeCharge);
        });

        const totalRevenue = timeRevenue + productRevenue;

        return {
            success: true,
            timeRevenue,
            productRevenue,
            totalRevenue,
            timePercentage: totalRevenue > 0 ? (timeRevenue / totalRevenue) * 100 : 0,
            productPercentage: totalRevenue > 0 ? (productRevenue / totalRevenue) * 100 : 0
        };
    } catch (error) {
        console.error('[getSalesMix] Error:', error);
        return {
            success: false,
            error: 'Database error',
            timeRevenue: 0,
            productRevenue: 0,
            totalRevenue: 0,
            timePercentage: 0,
            productPercentage: 0
        };
    }
}

/**
 * Get VIP conversion metrics
 */
export async function getVIPConversionMetrics(tenantId: string) {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) {
            return { success: false, error: 'Tenant not found', metrics: null };
        }

        // @ts-ignore
        const vipThreshold = tenant.tierSettings?.vipThreshold || 50000;

        const generalMembers = await prisma.member.findMany({
            where: { tenantId, category: 'GENERAL' }
        });

        const vipMembers = await prisma.member.findMany({
            where: { tenantId, category: 'VIP' }
        });

        const candidates = generalMembers.filter(m => m.amountSpent >= vipThreshold);

        return {
            success: true,
            metrics: {
                totalGeneral: generalMembers.length,
                totalVIP: vipMembers.length,
                candidatesForUpgrade: candidates.length,
                conversionRate: generalMembers.length > 0
                    ? (vipMembers.length / (generalMembers.length + vipMembers.length)) * 100
                    : 0,
                vipThreshold,
                candidates: candidates.map(c => ({
                    id: c.id,
                    name: c.name,
                    amountSpent: c.amountSpent
                }))
            }
        };
    } catch (error) {
        console.error('[getVIPConversionMetrics] Error:', error);
        return { success: false, error: 'Database error', metrics: null };
    }
}

/**
 * Get table occupancy metrics
 */
export async function getTableOccupancyMetrics(tenantId: string, days: number = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const tables = await prisma.table.findMany({
            where: { tenantId },
            include: {
                usageLogs: {
                    where: {
                        startedAt: { gte: startDate }
                    }
                }
            }
        });

        const totalTables = tables.length;
        const totalPossibleHours = totalTables * days * 24; // Total table-hours available

        let totalUsedMinutes = 0;
        tables.forEach(table => {
            table.usageLogs.forEach(log => {
                totalUsedMinutes += log.durationMinutes || 0;
            });
        });

        const totalUsedHours = totalUsedMinutes / 60;
        const occupancyRate = totalPossibleHours > 0
            ? (totalUsedHours / totalPossibleHours) * 100
            : 0;

        return {
            success: true,
            metrics: {
                totalTables,
                totalUsedHours,
                totalPossibleHours,
                occupancyRate,
                averageSessionsPerTable: totalTables > 0
                    ? tables.reduce((sum, t) => sum + t.usageLogs.length, 0) / totalTables
                    : 0
            }
        };
    } catch (error) {
        console.error('[getTableOccupancyMetrics] Error:', error);
        return { success: false, error: 'Database error', metrics: null };
    }
}

/**
 * 🛡️ SENTINEL: Audit report integrity
 */
export async function auditReportIntegrity(tenantId: string, days: number = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Sum from PaymentRecords
        const paymentRecords = await prisma.paymentRecord.findMany({
            where: {
                tenantId,
                status: 'COMPLETED',
                createdAt: { gte: startDate }
            }
        });

        const paymentTotal = paymentRecords.reduce((sum, p) => sum + p.amount, 0);

        // Sum from UsageLogs marked PAID
        const usageLogs = await prisma.usageLog.findMany({
            where: {
                tenantId,
                paymentStatus: 'PAID',
                endedAt: { gte: startDate }
            }
        });

        const usageLogTotal = usageLogs.reduce((sum, l) => sum + l.amountCharged, 0);

        const tolerance = 0.01; // 1 centavo
        const discrepancy = Math.abs(paymentTotal - usageLogTotal);
        const isValid = discrepancy <= tolerance;

        return {
            success: true,
            audit: {
                isValid,
                paymentRecordTotal: paymentTotal,
                usageLogTotal: usageLogTotal,
                discrepancy,
                tolerance
            }
        };
    } catch (error) {
        console.error('[auditReportIntegrity] Error:', error);
        return { success: false, error: 'Database error', audit: null };
    }
}
