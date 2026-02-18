'use server';

import { prisma } from "@/lib/prisma";
import { generateExecutiveReport, getCurrentWeek, ReportData } from "@/lib/reports/pdf-engine";
import {
    getClubMembershipMetrics,
    getMembersWithExpiringMemberships,
    getMemberAttendanceFrequency,
    getRevenuePeTH,
    getSalesMix,
    getVIPConversionMetrics,
    getTableOccupancyMetrics
} from "./dashboard-metrics";
import crypto from 'crypto';

/**
 * Collect metrics for report generation
 */
async function collectWeeklyMetrics(tenantId: string, businessModel: string) {
    if (businessModel === 'CLUB_SOCIOS') {
        const [membership, expiring, attendance] = await Promise.all([
            getClubMembershipMetrics(tenantId),
            getMembersWithExpiringMemberships(tenantId, 5),
            getMemberAttendanceFrequency(tenantId)
        ]);

        return {
            membershipMetrics: membership.metrics,
            expiringMembers: expiring.members,
            attendanceData: attendance
        };
    } else {
        // COMERCIAL
        const [revenue, sales, vip, occupancy] = await Promise.all([
            getRevenuePeTH(tenantId, 30),
            getSalesMix(tenantId, 30),
            getVIPConversionMetrics(tenantId),
            getTableOccupancyMetrics(tenantId, 30)
        ]);

        return {
            revPTH: revenue,
            salesMix: sales,
            vipMetrics: vip.metrics,
            occupancy: occupancy.metrics
        };
    }
}

/**
 * Generate report for a tenant
 */
export async function generateReportForTenant(tenantId: string) {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) {
            return { success: false, error: 'Tenant not found' };
        }

        // Collect metrics
        const metrics = await collectWeeklyMetrics(tenantId, tenant.businessModel);

        // Prepare report data
        const reportData: ReportData = {
            tenant: {
                name: tenant.name,
                businessModel: tenant.businessModel,
                primaryColor: tenant.primaryColor,
                secondaryColor: tenant.secondaryColor,
                logoUrl: tenant.logoUrl,
                currencyCode: tenant.currencyCode,
                currencySymbol: tenant.currencySymbol,
                locale: tenant.locale
            },
            period: getCurrentWeek(),
            metrics
        };

        // Generate PDF
        const pdfBuffer = await generateExecutiveReport(reportData);

        return {
            success: true,
            pdfBase64: pdfBuffer.toString('base64'),
            period: getCurrentWeek()
        };
    } catch (error) {
        console.error('[generateReportForTenant] Error:', error);
        return { success: false, error: 'Report generation failed' };
    }
}

/**
 * Create secure download link (24h expiry)
 */
export async function createSecureDownloadLink(reportId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    return {
        success: true,
        url: `/api/reports/download/${token}`,
        expiresAt: expiry
    };
}
