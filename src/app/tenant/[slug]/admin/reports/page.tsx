import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import ReportsClient from "./ReportsClient";
import { getDashboardStats, getRevenueChartData } from "@/app/actions/report-actions";

interface ReportsPageProps {
    params: Promise<{ slug: string }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
    const { slug } = await params;
    const session = await auth();

    if (!session || session.user.tenantSlug !== slug) redirect('/login');
    if (session.user.role !== 'ADMIN') redirect('/403');

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) notFound();

    // Initial Data Fetch (Default Today)
    const stats = await getDashboardStats('today');
    const chartData = await getRevenueChartData('today');

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reportes y Analítica</h1>
                    <p className="text-sm text-gray-500">Inteligencia de Negocios para {tenant.name}</p>
                </div>
            </header>

            <ReportsClient
                initialStats={stats}
                initialChartData={chartData}
                tenantSlug={slug}
                primaryColor={tenant.primaryColor}
            />
        </div>
    );
}
