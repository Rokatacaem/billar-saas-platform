'use client';

import { useState, useTransition } from 'react';
import { deleteTenant } from '@/app/actions/admin-actions';

interface DeleteTenantButtonProps {
    tenantId: string;
    tenantName: string;
}

/**
 * Botón de eliminación de Tenant con modal de confirmación personalizado.
 * Solo visible y operativo para SUPER_ADMIN.
 */
export default function DeleteTenantButton({ tenantId, tenantName }: DeleteTenantButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleConfirm() {
        setError(null);
        startTransition(async () => {
            try {
                await deleteTenant(tenantId);
                setShowModal(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al eliminar');
            }
        });
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setShowModal(true)}
                className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
                title={`Eliminar ${tenantName}`}
            >
                Eliminar
            </button>

            {/* Modal Overlay */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5"
                        style={{ animation: 'fadeInScale 0.2s ease-out' }}>

                        {/* Icon + Header */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg leading-tight">
                                    ¿Eliminar club?
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    Estás a punto de eliminar permanentemente{' '}
                                    <span className="text-white font-semibold">&ldquo;{tenantName}&rdquo;</span>
                                </p>
                            </div>
                        </div>

                        {/* Warning Box */}
                        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 space-y-1">
                            <p className="text-red-300 text-xs font-semibold uppercase tracking-wide">Esta acción es irreversible</p>
                            <p className="text-red-200/70 text-xs">
                                Se eliminarán todas las mesas, usuarios, socios, historial de sesiones, pagos, y configuraciones asociadas.
                            </p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                                <p className="text-red-300 text-xs">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => { setShowModal(false); setError(null); }}
                                disabled={isPending}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Eliminando...
                                    </>
                                ) : (
                                    'Sí, eliminar club'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    );
}
