'use client';

import { useEffect, useState } from 'react';
import {
    getRevenuePeTH,
    getSalesMix,
    getVIPConversionMetrics,
    getTableOccupancyMetrics
} from '@/app/actions/dashboard-metrics';
import { formatPrice } from '@/lib/pricing/PricingEngine';

export default function ComercialDashboardClient({ tenant }: { tenant: any }) {
    const [revPTH, setRevPTH] = useState<any>(null);
    const [salesMix, setSalesMix] = useState<any>(null);
    const [vipMetrics, setVipMetrics] = useState<any>(null);
    const [occupancy, setOccupancy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMetrics() {
            setLoading(true);

            const [revenue, sales, vip, occ] = await Promise.all([
                getRevenuePeTH(tenant.id, 30),
                getSalesMix(tenant.id, 30),
                getVIPConversionMetrics(tenant.id),
                getTableOccupancyMetrics(tenant.id, 30)
            ]);

            if (revenue.success) setRevPTH(revenue);
            if (sales.success) setSalesMix(sales);
            if (vip.success && vip.metrics) setVipMetrics(vip.metrics);
            if (occ.success && occ.metrics) setOccupancy(occ.metrics);

            setLoading(false);
        }

        loadMetrics();
    }, [tenant.id]);

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">💼 Dashboard Comercial</h1>
                    <p className="text-gray-600 mt-1">{tenant.name} - Modelo COMERCIAL</p>
                </div>
            </div>

            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow-md border border-green-200">
                    <div className="text-sm font-medium text-green-700">RevPTH (Revenue Per Table Hour)</div>
                    <div className="text-4xl font-bold text-green-900 mt-2">
                        {formatPrice(revPTH?.revPTH || 0, tenant)}
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                        Últimas {revPTH?.totalHours.toFixed(0)} horas de juego
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-200">
                    <div className="text-sm font-medium text-blue-700">Ingresos Totales (30 días)</div>
                    <div className="text-4xl font-bold text-blue-900 mt-2">
                        {formatPrice(revPTH?.totalRevenue || 0, tenant)}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg shadow-md border border-purple-200">
                    <div className="text-sm font-medium text-purple-700">Tasa de Ocupación</div>
                    <div className="text-4xl font-bold text-purple-900 mt-2">
                        {occupancy?.occupancyRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-purple-600 mt-2">
                        {occupancy?.totalUsedHours.toFixed(0)}h / {occupancy?.totalPossibleHours.toFixed(0)}h disponibles
                    </div>
                </div>
            </div>

            {/* Sales Mix */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    📊 Mix de Ventas (Últimos 30 días)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visual Pie Chart Simulation */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-48 h-48">
                            {/* Simple visual representation */}
                            <div className="absolute inset-0 rounded-full border-8 border-blue-500"
                                style={{
                                    background: `conic-gradient(
                                         #3b82f6 0% ${salesMix?.timePercentage}%, 
                                         #f59e0b ${salesMix?.timePercentage}% 100%
                                     )`
                                }}>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                <span className="text-sm text-gray-700">
                                    Tiempo de Mesa: {salesMix?.timePercentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                <span className="text-sm text-gray-700">
                                    Consumo Bar: {salesMix?.productPercentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-3">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="text-sm text-blue-700 font-medium">Ingresos por Tiempo</div>
                            <div className="text-2xl font-bold text-blue-900 mt-1">
                                {formatPrice(salesMix?.timeRevenue || 0, tenant)}
                            </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="text-sm text-yellow-700 font-medium">Ingresos por Productos</div>
                            <div className="text-2xl font-bold text-yellow-900 mt-1">
                                {formatPrice(salesMix?.productRevenue || 0, tenant)}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                            <div className="text-sm text-gray-700 font-medium">Total</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                {formatPrice(salesMix?.totalRevenue || 0, tenant)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VIP Conversion */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    💎 Conversión VIP
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Clientes GENERAL</div>
                        <div className="text-3xl font-bold text-gray-900 mt-1">{vipMetrics?.totalGeneral || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Clientes VIP</div>
                        <div className="text-3xl font-bold text-yellow-600 mt-1">{vipMetrics?.totalVIP || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Candidatos a Upgrade</div>
                        <div className="text-3xl font-bold text-orange-600 mt-1">{vipMetrics?.candidatesForUpgrade || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Tasa de Conversión</div>
                        <div className="text-3xl font-bold text-green-600 mt-1">{vipMetrics?.conversionRate.toFixed(1)}%</div>
                    </div>
                </div>

                {/* Candidates List */}
                {vipMetrics && vipMetrics.candidates && vipMetrics.candidates.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-yellow-300">
                        <h3 className="font-bold text-gray-900 mb-3">
                            🎯 Sugerencias de Upgrade (Threshold: {formatPrice(vipMetrics.vipThreshold, tenant)})
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {vipMetrics.candidates.slice(0, 10).map((candidate: any) => (
                                <div key={candidate.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded border border-yellow-200">
                                    <span className="font-medium text-gray-900">{candidate.name}</span>
                                    <span className="text-sm font-bold text-green-700">
                                        {formatPrice(candidate.amountSpent, tenant)} gastado
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Table Occupancy */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    🎱 Ocupación de Mesas (Últimos 30 días)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-purple-700">Total de Mesas</div>
                        <div className="text-3xl font-bold text-purple-900 mt-1">{occupancy?.totalTables || 0}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-sm text-green-700">Horas Utilizadas</div>
                        <div className="text-3xl font-bold text-green-900 mt-1">{occupancy?.totalUsedHours.toFixed(0)}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-700">Promedio Sesiones/Mesa</div>
                        <div className="text-3xl font-bold text-blue-900 mt-1">{occupancy?.averageSessionsPerTable.toFixed(1)}</div>
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">💡 Insights Automáticos</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                    {occupancy && occupancy.occupancyRate < 30 && (
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">⚠️</span>
                            <span><strong>Baja ocupación ({occupancy.occupancyRate.toFixed(1)}%):</strong> Considera promociones en horarios valle</span>
                        </li>
                    )}
                    {salesMix && salesMix.productPercentage < 20 && (
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">💡</span>
                            <span><strong>Bajo consumo de bar ({salesMix.productPercentage.toFixed(1)}%):</strong> Implementar happy hour o combos</span>
                        </li>
                    )}
                    {vipMetrics && vipMetrics.candidatesForUpgrade > 0 && (
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✨</span>
                            <span><strong>{vipMetrics.candidatesForUpgrade} clientes listos para VIP:</strong> Enviar invitación personalizada con beneficios</span>
                        </li>
                    )}
                    {revPTH && revPTH.revPTH > 0 && (
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500">📈</span>
                            <span><strong>RevPTH: {formatPrice(revPTH.revPTH, tenant)}:</strong> {revPTH.revPTH > 1000 ? 'Excelente rendimiento' : 'Optimizar precios o rotación'}</span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
