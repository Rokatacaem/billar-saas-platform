'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTenantStatus, updateTenantPlan } from '@/app/actions/admin-actions';
import { formatCurrency } from '@/lib/i18n';

// Tipos manuales de Prisma para el cliente
type TenantWithCounts = {
    id: string;
    name: string;
    slug: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
    plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
    baseRate: number;
    currencyCode: string;
    _count: {
        usageLogs: number;
        members: number;
    }
};

export default function BillingClient({ initialTenants }: { initialTenants: any[] }) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleStatusChange = async (tenantId: string, newStatus: string) => {
        setLoadingId(tenantId);
        try {
            await updateTenantStatus(tenantId, newStatus as any);
            router.refresh();
        } catch (error) {
            alert('Error updating status');
        } finally {
            setLoadingId(null);
        }
    };

    const handlePlanChange = async (tenantId: string, newPlan: string) => {
        setLoadingId(tenantId);
        try {
            await updateTenantPlan(tenantId, newPlan as any);
            router.refresh();
        } catch (error) {
            alert('Error updating plan');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3">Tenant</th>
                        <th className="px-6 py-3">Plan</th>
                        <th className="px-6 py-3">Métricas (Simuladas)</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {initialTenants.map((tenant: any) => (
                        <tr key={tenant.id} className="bg-white border-b hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                <div>{tenant.name}</div>
                                <div className="text-xs text-gray-500">{tenant.slug}.localhost</div>
                            </td>
                            <td className="px-6 py-4">
                                <select
                                    value={tenant.plan}
                                    disabled={loadingId === tenant.id}
                                    onChange={(e) => handlePlanChange(tenant.id, e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                >
                                    <option value="BASIC">Básico</option>
                                    <option value="PRO">Pro</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-xs">
                                    <span>👥 {tenant._count.members} Socios</span>
                                    <span>💰 {tenant._count.usageLogs} Sesiones Pagadas</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                        tenant.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {tenant.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    disabled={loadingId === tenant.id}
                                    onClick={() => handleStatusChange(tenant.id, tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                                    className={`font-medium text-xs px-3 py-1.5 rounded border transition-colors ${tenant.status === 'ACTIVE'
                                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                                            : 'text-green-600 border-green-200 hover:bg-green-50'
                                        }`}
                                >
                                    {tenant.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
