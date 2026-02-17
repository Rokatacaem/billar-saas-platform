"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TableCard from './TableCard';
import ActiveSessionPanel from '@/components/pos/ActiveSessionPanel';
import { checkNewPayments } from '@/app/actions/payment-actions';
import { useRouter } from 'next/navigation';

interface TenantDashboardProps {
    tenant: any;
    tables: any[];
    products: any[];
    role: string;
}

export default function TenantDashboard({ tenant, tables, products, role }: TenantDashboardProps) {
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
    const router = useRouter();

    const selectedTable = tables.find(t => t.id === selectedTableId);

    // Polling for new payments (Every 30 seconds for MVP)
    useEffect(() => {
        if (role !== 'ADMIN') return;

        let lastCheck = Date.now();
        const interval = setInterval(async () => {
            const newPayments = await checkNewPayments(tenant.id, lastCheck);
            if (newPayments.length > 0) {
                const latest = newPayments[0];
                setNotification({
                    message: `💰 Pago Recibido: $${latest.amount} en Mesa ${latest.table}`,
                    type: 'success'
                });
                // Play sound
                const audio = new Audio('/notification.mp3'); // Assuming file exists or fails silently
                audio.play().catch(() => { });

                lastCheck = Date.now();
                router.refresh(); // Refresh to update table status
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [tenant.id, role, router]);

    return (
        <div className="w-full max-w-4xl relative">
            {/* Toast Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
                    <div className="bg-white border-l-4 border-emerald-500 shadow-lg rounded-lg p-4 flex items-center gap-3 w-80">
                        <div className="text-2xl">🎉</div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800">Nuevo Pago</h4>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                        </div>
                        <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">×</button>
                    </div>
                </div>
            )}

            {/* Admin Section */}
            {role === 'ADMIN' && (
                <div className="mb-8 p-4 bg-purple-50 border border-purple-100 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider">Panel de Administración</h3>
                        <p className="text-xs text-purple-600">Acceso exclusivo para administradores</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                        <Link
                            href={`/tenant/${tenant.slug}/admin/members`}
                            className="px-4 py-2 bg-white text-purple-700 text-sm font-semibold rounded-lg shadow-sm border border-purple-200 hover:bg-purple-100 transition-colors"
                        >
                            👥 Socios
                        </Link>
                        <Link
                            href={`/tenant/${tenant.slug}/admin/inventory`}
                            className="px-4 py-2 bg-white text-purple-700 text-sm font-semibold rounded-lg shadow-sm border border-purple-200 hover:bg-purple-100 transition-colors"
                        >
                            📦 Inventario
                        </Link>
                        <Link
                            href={`/tenant/${tenant.slug}/admin/reports`}
                            className="px-4 py-2 bg-white text-purple-700 text-sm font-semibold rounded-lg shadow-sm border border-purple-200 hover:bg-purple-100 transition-colors"
                        >
                            📊 Reportes
                        </Link>
                        <Link
                            href={`/tenant/${tenant.slug}/admin/finance`}
                            className="px-4 py-2 bg-white text-emerald-700 text-sm font-semibold rounded-lg shadow-sm border border-emerald-200 hover:bg-emerald-50 transition-colors"
                        >
                            💰 Finanzas
                        </Link>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-semibold mb-6 text-gray-700">Estado de Mesas</h2>

            {tables.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500">No hay mesas configuradas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tables.map((table) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            primaryColor={tenant.primaryColor}
                            // Pass a special handler if we modify TableCard
                            // For now, let's assume we modify TableCard to call `onSelect` if occupied.
                            onSelect={() => setSelectedTableId(table.id)}
                        />
                    ))}
                </div>
            )}

            {selectedTable && (
                <ActiveSessionPanel
                    table={selectedTable}
                    products={products}
                    onClose={() => setSelectedTableId(null)}
                    tenantBaseRate={tenant.baseRate}
                />
            )}
        </div>
    );
}
