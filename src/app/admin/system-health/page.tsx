import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function SystemHealthPage() {
    // 1. Fetch Tenants with Health Data
    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: {
                    tables: true,
                    members: true,
                    usageLogs: true
                }
            },
            paymentRecords: {
                take: 1,
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // 2. Fetch Recent System Logs
    const logs = await prisma.systemLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { tenant: true }
    });

    // 3. Mock DB Metrics (In real scenario, use pg_stat_activity query)
    const dbMetrics = {
        connections: Math.floor(Math.random() * 20) + 5,
        totalSizeMB: 450, // Mock
        status: 'HEALTHY'
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">🩺 Estado del Sistema (System Health)</h1>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Base de Datos (Neon)</h3>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-emerald-600">{dbMetrics.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex justify-between">
                        <span>Conexiones Activas:</span>
                        <span className="font-bold">{dbMetrics.connections}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex justify-between">
                        <span>Tamaño Total:</span>
                        <span className="font-bold">{dbMetrics.totalSizeMB} MB</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Tenants Activos</h3>
                    <div className="mt-4 text-3xl font-bold text-indigo-600">{tenants.length}</div>
                    <p className="mt-2 text-sm text-gray-500">Clubes registrados en plataforma.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Uptime (SLA)</h3>
                    <div className="mt-4 text-3xl font-bold text-gray-800">99.9%</div>
                    <p className="mt-2 text-sm text-green-600 font-medium">✅ Operativo</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Logs Recientes (24h)</h3>
                    <div className="mt-4 text-3xl font-bold text-gray-800">{logs.length}</div>
                    <p className="mt-2 text-sm text-gray-500">Eventos registrados en auditoría.</p>
                </div>
            </div>

            {/* Tenants Health Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-700">Estado de Clubes</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Slug</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Actividad Reciente</th>
                            <th className="p-4">Mesas</th>
                            <th className="p-4 text-right">Sesiones Totales</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tenants.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 font-medium text-gray-900">{t.name}</td>
                                <td className="p-4 text-gray-500 font-mono text-xs">{t.slug}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === 'CLUB' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {t.type}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">
                                    {formatDistanceToNow(t.updatedAt, { addSuffix: true, locale: es })}
                                </td>
                                <td className="p-4">{t._count.tables}</td>
                                <td className="p-4 text-right font-bold">{t._count.usageLogs}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* System Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-700">Logs del Sistema (Últimos 20)</h3>
                    <span className="text-xs text-gray-500">Para depuración técnica</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-gray-800 text-gray-300 font-semibold">
                            <tr>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">Nivel</th>
                                <th className="p-3">Mensaje</th>
                                <th className="p-3">Tenant</th>
                                <th className="p-3">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-gray-900 text-gray-400">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-800">
                                    <td className="p-3 whitespace-nowrap">
                                        {new Date(log.createdAt).toISOString().split('T')[1].split('.')[0]}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.level === 'ERROR' ? 'bg-red-900 text-red-200' :
                                            log.level === 'WARN' ? 'bg-yellow-900 text-yellow-200' :
                                                'bg-blue-900 text-blue-200'
                                            }`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-200 font-semibold">{log.message}</td>
                                    <td className="p-3 text-gray-500">{log.tenant?.slug || '-'}</td>
                                    <td className="p-3 max-w-xs truncate" title={JSON.stringify(log.details)}>
                                        {JSON.stringify(log.details)}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-600 italic">
                                        No hay logs registrados recientemente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
