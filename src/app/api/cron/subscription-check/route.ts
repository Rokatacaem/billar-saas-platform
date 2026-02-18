
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Check for Bearer token secret to protect this endpoint
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // In development we might want to allow it without secret or with a default one
        if (process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        const today = new Date();
        const fiveDaysFromNow = new Date(today);
        fiveDaysFromNow.setDate(today.getDate() + 5);

        // Normalize to start of day for comparison if needed, or just range
        const startOfTargetDay = new Date(fiveDaysFromNow);
        startOfTargetDay.setHours(0, 0, 0, 0);
        const endOfTargetDay = new Date(fiveDaysFromNow);
        endOfTargetDay.setHours(23, 59, 59, 999);

        // Find tenants expiring in exactly 5 days
        const expiringTenants = await prisma.tenant.findMany({
            where: {
                status: 'ACTIVE',
                subscriptionEnd: {
                    gte: startOfTargetDay,
                    lte: endOfTargetDay
                }
            },
            include: {
                users: { // Get admin users to notify
                    where: { role: 'ADMIN' },
                    select: { email: true, name: true }
                }
            }
        });

        const results = [];

        for (const tenant of expiringTenants) {
            // Simulation of email sending
            console.log(`[SUBSCRIPTION-ALERT] Sending email to ${tenant.name} (${tenant.users.length} admins)`);

            for (const user of tenant.users) {
                if (user.email) {
                    console.log(`To: ${user.email} -> Subject: "Tu servicio vence en 5 días"`);
                    // Here we would call Resend or similar
                }
            }
            results.push({ tenant: tenant.slug, adminsNotified: tenant.users.length });
        }

        return NextResponse.json({
            success: true,
            processed: expiringTenants.length,
            details: results
        });

    } catch (error: any) {
        console.error('Subscription check failed:', error);
        return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }
}
