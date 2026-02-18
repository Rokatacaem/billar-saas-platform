import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/i18n";
import BillingClient from "./BillingClient";

export default async function BillingDashboard() {
    // Fetch all tenants with their stats
    const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    usageLogs: { where: { paymentStatus: 'PAID' } }, // Total Paid Sessions
                    members: true
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gobierno & Facturación</h1>
                    <p className="text-muted-foreground">Control comercial de la plataforma.</p>
                </div>
                <div className="flex gap-2">
                    {/* KPI Cards Placeholder */}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-semibold">Listado de Suscripciones</h2>
                </div>
                <BillingClient initialTenants={tenants} />
            </div>
        </div>
    );
}
