'use client';

import { useState, useTransition } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { getDashboardStats, getRevenueChartData, closeDailyCash } from '@/app/actions/report-actions';

interface ReportsClientProps {
    initialStats: any;
    initialChartData: any[];
    tenantSlug: string;
    primaryColor: string;
}

export default function ReportsClient({ initialStats, initialChartData, tenantSlug, primaryColor }: ReportsClientProps) {
    const [stats, setStats] = useState(initialStats);
    const [chartData, setChartData] = useState(initialChartData);
    const [range, setRange] = useState<'today' | '7days' | 'month'>('today');
    const [isPending, startTransition] = useTransition();

    const handleRangeChange = (newRange: 'today' | '7days' | 'month') => {
        setRange(newRange);
        startTransition(async () => {
            const newStats = await getDashboardStats(newRange);
            const newChart = await getRevenueChartData(newRange);
            setStats(newStats);
            setChartData(newChart);
        });
    };

    const handleCloseCash = async () => {
        if (!confirm("¿Estás seguro de realizar el CIERRE DE CAJA? Esto consolidará las ventas auditadas hasta el momento.")) return;

        startTransition(async () => {
            const res = await closeDailyCash();
            if (res.success) {
                alert(`✅ Cierre Exitoso. ID: ${res.balanceId}`);
                // Refresh logic would go here
            } else {
                alert(`❌ Error: ${res.error || res.message}`);
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['today', '7days', 'month'].map((r) => (
                        <button
                            key={r}
                            onClick={() => handleRangeChange(r as any)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {r === 'today' ? 'Hoy' : r === '7days' ? '7 Días' : 'Mes'}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleCloseCash}
                    disabled={isPending}
                    className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Procesando...' : '🖨️ Cerrar Caja'}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard
                    title="Ingresos Totales"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    sub={`$${stats.timeRevenue} (Tiempo) + $${stats.productRevenue} (Bar)`}
                    color="indigo"
                />
                <KpiCard
                    title="Mesas Activas"
                    value={stats.activeTablesCount}
                    sub="En tiempo real"
                    color="green"
                />
                <KpiCard
                    title="RevPTH"
                    value={`$${stats.revPTH}`}
                    sub="Ingreso prom. hora/mesa"
                    color="blue"
                />
                <KpiCard
                    title="Sesiones"
                    value={stats.totalSessions}
                    sub="Total atendidas"
                    color="purple"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Desglose de Ingresos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                formatter={(val: number | undefined) => `$${val ?? 0}`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="time" name="Tiempo" stackId="a" fill={primaryColor} radius={[0, 0, 4, 4]} />
                            <Bar dataKey="product" name="Bar" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Occupation / Trend Chart (Mocked as Line for now using same data or different) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tendencia de Ingresos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(val: number | undefined) => `$${val ?? 0}`} />
                            <Line type="monotone" dataKey="product" stroke="#fbbf24" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="time" stroke={primaryColor} strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, sub, color }: { title: string, value: string | number, sub: string, color: string }) {
    const colors: any = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        green: 'bg-green-50 text-green-700 border-green-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        purple: 'bg-purple-50 text-purple-700 border-purple-100',
    };

    return (
        <div className={`p-6 rounded-2xl border ${colors[color]}`}>
            <h3 className="text-sm font-medium opacity-80 uppercase tracking-wide">{title}</h3>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className="text-xs mt-1 opacity-70">{sub}</p>
        </div>
    );
}
