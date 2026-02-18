import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReportForTenant } from '@/app/actions/report-generation';
import { sendEmail, getWeeklyReportEmailTemplate } from '@/lib/email/resend';
import { logSecurityEvent, ThreatLevel } from '@/lib/security/intrusion-detector';
import { getCurrentWeek } from '@/lib/reports/pdf-engine';

/**
 * 🛡️ CRON: Weekly Executive Report Generation
 * Runs every Monday at 8 AM
 * Protected by CRON_SECRET
 */
export async function GET(req: NextRequest) {
    // 🛡️ SENTINEL: Verify CRON_SECRET
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        await logSecurityEvent({
            type: 'CRON_UNAUTHORIZED',
            severity: ThreatLevel.HIGH,
            message: 'Unauthorized cron access attempt',
            details: {
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent')
            },
            tenantId: undefined
        });

        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // Get all active tenants
        const tenants = await prisma.tenant.findMany({
            where: { status: 'ACTIVE' },
            select: {
                id: true,
                name: true,
                primaryColor: true,
                logoUrl: true,
                businessModel: true,
                users: {
                    where: { role: 'OWNER' },
                    select: { email: true }
                }
            }
        });

        const results = [];
        const period = getCurrentWeek();

        for (const tenant of tenants) {
            try {
                // Get owner email
                const ownerEmail = tenant.users[0]?.email;

                if (!ownerEmail) {
                    results.push({
                        tenantId: tenant.id,
                        success: false,
                        error: 'No owner email found'
                    });
                    continue;
                }

                // Generate report
                const reportResult = await generateReportForTenant(tenant.id);

                if (!reportResult.success || !reportResult.pdfBase64) {
                    results.push({
                        tenantId: tenant.id,
                        success: false,
                        error: reportResult.error || 'Report generation failed'
                    });
                    continue;
                }

                // Convert base64 to Buffer
                const pdfBuffer = Buffer.from(reportResult.pdfBase64, 'base64');

                // Generate branded email
                const emailHtml = getWeeklyReportEmailTemplate(
                    {
                        name: tenant.name,
                        primaryColor: tenant.primaryColor,
                        logoUrl: tenant.logoUrl
                    },
                    period
                );

                // Send email via Resend
                const emailResult = await sendEmail({
                    to: ownerEmail,
                    subject: `📊 Reporte Semanal ${tenant.name} - ${period}`,
                    html: emailHtml,
                    attachments: [{
                        filename: `Reporte-${tenant.name}-${period}.pdf`,
                        content: pdfBuffer
                    }]
                });

                // 🛡️ SENTINEL: Log delivery status
                await logSecurityEvent({
                    type: 'CRON_REPORT_DELIVERY',
                    severity: emailResult.success ? ThreatLevel.LOW : ThreatLevel.MEDIUM,
                    message: emailResult.success
                        ? `Weekly report sent successfully to ${ownerEmail}`
                        : `Failed to send weekly report to ${ownerEmail}`,
                    details: {
                        tenantId: tenant.id,
                        period,
                        error: emailResult.error
                    },
                    tenantId: tenant.id
                });

                results.push({
                    tenantId: tenant.id,
                    success: emailResult.success,
                    email: ownerEmail
                });

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`[Cron] Failed for tenant ${tenant.id}:`, error);

                await logSecurityEvent({
                    type: 'CRON_TENANT_FAILED',
                    severity: ThreatLevel.MEDIUM,
                    message: `Weekly report cron failed for tenant`,
                    details: {
                        tenantId: tenant.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    },
                    tenantId: tenant.id
                });

                results.push({
                    tenantId: tenant.id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            processed: tenants.length,
            successful: successCount,
            failed: tenants.length - successCount,
            results
        });
    } catch (error) {
        console.error('[Cron] Error:', error);

        await logSecurityEvent({
            type: 'CRON_JOB_FAILED',
            severity: ThreatLevel.HIGH,
            message: 'Weekly report cron job failed',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            tenantId: undefined
        });

        return NextResponse.json(
            { success: false, error: 'Cron job failed' },
            { status: 500 }
        );
    }
}
