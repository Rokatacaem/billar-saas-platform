import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import ZReportClient from "./ZReportClient";

interface ZReportPageProps {
    params: Promise<{ slug: string }>;
}

export default async function ZReportPage({ params }: ZReportPageProps) {
    const { slug } = await params;
    const session = await auth();

    if (!session || session.user.tenantSlug !== slug) redirect('/login');
    if (session.user.role !== 'ADMIN') redirect('/403');

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) notFound();

    const balances = await prisma.dailyBalance.findMany({
        where: { tenantId: tenant.id },
        include: { _count: { select: { usageLogs: true } } },
        orderBy: { date: 'desc' },
        take: 30
    });

    // Sesiones pendientes de consolidar (para el badge del botón)
    const pendingCount = await prisma.usageLog.count({
        where: {
            tenantId: tenant.id,
            endedAt: { not: null },
            dailyBalanceId: null
        }
    });

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Z-Report · Cierre de Turno</h1>
                        <p className="text-sm text-gray-500 mt-1">Consolidado financiero inmutable por turno — {tenant.name}</p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-amber-700">{pendingCount} sesiones pendientes</span>
                        </div>
                    )}
                </div>
            </header>

            <ZReportClient
                balances={balances.map(b => ({
                    ...b,
                    date: b.date.toISOString(),
                    createdAt: b.createdAt.toISOString(),
                    updatedAt: b.updatedAt.toISOString()
                }))}
                pendingCount={pendingCount}
            />
        </div>
    );
}
