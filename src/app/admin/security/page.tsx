import { Suspense } from 'react';
import { prisma } from '@/lib/security';
import { ThreatLevel } from '@/lib/security/intrusion-detector';

interface SecurityLog {
    id: string;
    level: string;
    message: string;
    details: any;
    createdAt: Date;
}

async function getSecurityLogs(): Promise<SecurityLog[]> {
    const logs = await prisma.systemLog.findMany({
        where: {
            OR: [
                { message: { contains: '[SECURITY-' } },
                { level: 'ERROR' }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return logs;
}

async function getSecurityStats() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stats = {
        totalEvents: await prisma.systemLog.count({
            where: {
                message: { contains: '[SECURITY-' },
                createdAt: { gte: last24h }
            }
        }),
        critical: await prisma.systemLog.count({
            where: {
                message: { contains: 'SECURITY-CRITICAL' },
                createdAt: { gte: last24h }
            }
        }),
        high: await prisma.systemLog.count({
            where: {
                message: { contains: 'SECURITY-HIGH' },
                createdAt: { gte: last24h }
            }
        }),
        medium: await prisma.systemLog.count({
            where: {
                message: { contains: 'SECURITY-MEDIUM' },
                createdAt: { gte: last24h }
            }
        }),
        bruteForceAttempts: await prisma.systemLog.count({
            where: {
                message: { contains: 'BRUTE_FORCE' },
                createdAt: { gte: last24h }
            }
        }),
        tenantViolations: await prisma.systemLog.count({
            where: {
                message: { contains: 'TENANT_ISOLATION_VIOLATION' },
                createdAt: { gte: last24h }
            }
        }),
        rateLimitBlocks: await prisma.systemLog.count({
            where: {
                message: { contains: 'RATE_LIMIT_EXCEEDED' },
                createdAt: { gte: last24h }
            }
        })
    };

    return stats;
}

function getThreatBadgeColor(message: string): string {
    if (message.includes('CRITICAL')) return 'bg-red-600';
    if (message.includes('HIGH')) return 'bg-orange-500';
    if (message.includes('MEDIUM')) return 'bg-yellow-500';
    return 'bg-blue-500';
}

export default async function SecurityDashboardPage() {
    const [logs, stats] = await Promise.all([
        getSecurityLogs(),
        getSecurityStats()
    ]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">🛡️ Security Dashboard</h1>
                <p className="text-gray-600">Monitoreo en tiempo real de eventos de seguridad</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-1">Total Eventos 24h</div>
                    <div className="text-3xl font-bold">{stats.totalEvents}</div>
                </div>

                <div className="bg-red-50 rounded-lg shadow p-6 border-l-4 border-red-600">
                    <div className="text-sm text-red-700 mb-1">Críticos</div>
                    <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
                </div>

                <div className="bg-orange-50 rounded-lg shadow p-6 border-l-4 border-orange-500">
                    <div className="text-sm text-orange-700 mb-1">Alta Prioridad</div>
                    <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
                </div>

                <div className="bg-yellow-50 rounded-lg shadow p-6 border-l-4 border-yellow-500">
                    <div className="text-sm text-yellow-700 mb-1">Media Prioridad</div>
                    <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
                </div>
            </div>

            {/* Threat Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-2">🔒 Brute Force</div>
                    <div className="text-2xl font-bold">{stats.bruteForceAttempts}</div>
                    <div className="text-xs text-gray-500 mt-1">Intentos bloqueados</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-2">🚨 Tenant Violations</div>
                    <div className="text-2xl font-bold">{stats.tenantViolations}</div>
                    <div className="text-xs text-gray-500 mt-1">Intentos de cross-tenant</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-sm text-gray-600 mb-2">⏱️ Rate Limiting</div>
                    <div className="text-2xl font-bold">{stats.rateLimitBlocks}</div>
                    <div className="text-xs text-gray-500 mt-1">IPs bloqueadas</div>
                </div>
            </div>

            {/* Security Events Log */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Eventos de Seguridad Recientes</h2>
                    <p className="text-sm text-gray-600 mt-1">Últimos 50 eventos de seguridad</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensaje</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        ✅ No hay eventos de seguridad recientes
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(log.createdAt).toLocaleString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${getThreatBadgeColor(log.message)}`}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {log.message}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {log.details && typeof log.details === 'object' && (
                                                <details className="cursor-pointer">
                                                    <summary className="text-blue-600 hover:text-blue-800">Ver detalles</summary>
                                                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex gap-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Exportar Reporte
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                    Configurar Alertas
                </button>
            </div>
        </div>
    );
}
