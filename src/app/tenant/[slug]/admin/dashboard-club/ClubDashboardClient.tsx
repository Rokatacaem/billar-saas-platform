'use client';

import { useEffect, useState } from 'react';
import {
    getClubMembershipMetrics,
    getMembersWithExpiringMemberships,
    getMemberAttendanceFrequency
} from '@/app/actions/dashboard-metrics';

export default function ClubDashboardClient({ tenant }: { tenant: any }) {
    const [membershipMetrics, setMembershipMetrics] = useState<any>(null);
    const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMetrics() {
            setLoading(true);

            const [membership, expiring, attendance] = await Promise.all([
                getClubMembershipMetrics(tenant.id),
                getMembersWithExpiringMemberships(tenant.id, 5),
                getMemberAttendanceFrequency(tenant.id)
            ]);

            if (membership.success) setMembershipMetrics(membership.metrics);
            if (expiring.success) setExpiringMembers(expiring.members);
            if (attendance.success) setAttendanceData(attendance);

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
                    <h1 className="text-3xl font-bold text-gray-900">🏛️ Dashboard Club de Socios</h1>
                    <p className="text-gray-600 mt-1">{tenant.name} - Modelo CLUB_SOCIOS</p>
                </div>
            </div>

            {/* Membership KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="text-sm font-medium text-gray-600">Total Socios</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{membershipMetrics?.total || 0}</div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg shadow border border-green-200">
                    <div className="text-sm font-medium text-green-700">Socios Activos</div>
                    <div className="text-3xl font-bold text-green-900 mt-2">{membershipMetrics?.active || 0}</div>
                    <div className="text-xs text-green-600 mt-1">
                        {membershipMetrics?.activePercentage.toFixed(1)}% del total
                    </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg shadow border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-700">Pendiente Pago</div>
                    <div className="text-3xl font-bold text-yellow-900 mt-2">{membershipMetrics?.pending || 0}</div>
                </div>

                <div className="bg-red-50 p-6 rounded-lg shadow border border-red-200">
                    <div className="text-sm font-medium text-red-700">Vencidos</div>
                    <div className="text-3xl font-bold text-red-900 mt-2">{membershipMetrics?.expired || 0}</div>
                    <div className="text-xs text-red-600 mt-1">
                        Churn: {membershipMetrics?.churnRate.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Expiring Memberships Alert */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-orange-900 mb-4">
                    ⚠️ Alertas de Cobro (Próximos 5 días)
                </h2>
                {expiringMembers.length === 0 ? (
                    <p className="text-sm text-orange-700">✅ No hay cuotas por vencer en los próximos 5 días</p>
                ) : (
                    <div className="space-y-2">
                        {expiringMembers.map(member => (
                            <div key={member.id} className="flex justify-between items-center bg-white p-3 rounded border border-orange-200">
                                <div>
                                    <span className="font-medium text-gray-900">{member.name}</span>
                                    <span className="text-sm text-gray-600 ml-2">({member.email || member.phone})</span>
                                </div>
                                <div className="text-sm text-orange-700 font-medium">
                                    Vence: {member.membershipDueDate ? new Date(member.membershipDueDate).toLocaleDateString('es-CL') : 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Attendance Frequency */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    📊 Frecuencia de Asistencia (Últimos 30 días)
                </h2>
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <span className="text-sm text-blue-900">
                        Promedio: <strong>{attendanceData?.averageFrequency.toFixed(1)} visitas/mes</strong>
                    </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {attendanceData?.data.slice(0, 20).map((member: any) => (
                        <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">{member.name}</span>
                                {member.status === 'ACTIVE' ? (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">ACTIVO</span>
                                ) : (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">{member.status}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold text-blue-600">{member.visitsLast30Days}</span>
                                <span className="text-sm text-gray-600">visitas</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">💡 Insights Automáticos</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                    {membershipMetrics?.churnRate > 20 && (
                        <li className="flex items-start gap-2">
                            <span className="text-red-500">⚠️</span>
                            <span><strong>Alta tasa de deserción ({membershipMetrics.churnRate.toFixed(1)}%):</strong> Considera lanzar campaña de retención</span>
                        </li>
                    )}
                    {expiringMembers.length > 5 && (
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-500">⚠️</span>
                            <span><strong>{expiringMembers.length} socios con cuota por vencer:</strong> Enviar recordatorios de pago</span>
                        </li>
                    )}
                    {attendanceData?.averageFrequency < 2 && (
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">⚠️</span>
                            <span><strong>Baja frecuencia promedio ({attendanceData.averageFrequency.toFixed(1)} visitas/mes):</strong> Implementar eventos exclusivos para socios</span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
