'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTenant } from '@/app/actions/admin-actions';

interface DeleteTenantButtonProps {
    tenantId: string;
    tenantName: string;
}

export default function DeleteTenantButton({ tenantId, tenantName }: DeleteTenantButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    function handleConfirm() {
        setError(null);
        startTransition(async () => {
            const result = await deleteTenant(tenantId);
            if (!result.success) {
                setError(result.error ?? 'Error desconocido al eliminar');
            } else {
                setShowModal(false);
                router.refresh(); // Re-fetch server data sin crash
            }
        });
    }

    return (
        <>
            <button
                onClick={() => { setError(null); setShowModal(true); }}
                className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
            >
                Eliminar
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget && !isPending) setShowModal(false); }}
                    style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
                >
                    {/* max-w-md (448px) para evitar el overflow del texto */}
                    <div
                        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        style={{ animation: 'dtb-in 0.18s ease-out' }}
                    >
                        {/* Header */}
                        <div className="px-8 pt-6 pb-4 text-center space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">¿Eliminar club?</h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    Eliminarás permanentemente{' '}
                                    <span className="text-white font-semibold">&ldquo;{tenantName}&rdquo;</span>
                                </p>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="mx-8 mb-4 bg-red-950/50 border border-red-800/60 rounded-xl p-3 text-center">
                            <p className="text-red-300 text-xs font-bold uppercase tracking-wider mb-1">
                                Esta acción es irreversible
                            </p>
                            <p className="text-red-200/60 text-xs leading-relaxed">
                                Mesas, usuarios, socios, historial de sesiones, pagos
                                y configuraciones serán eliminados para siempre.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mx-8 mb-4 bg-red-900/30 border border-red-700/60 rounded-lg p-3">
                                <p className="text-red-300 text-xs leading-snug break-all">{error}</p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="px-8 pb-6 flex gap-3">
                            <button
                                onClick={() => { setShowModal(false); setError(null); }}
                                disabled={isPending}
                                className="flex-1 py-2.5 rounded-xl border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Eliminando...
                                    </>
                                ) : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>

                    <style>{`
                        @keyframes dtb-in {
                            from { opacity:0; transform:scale(0.94) translateY(10px); }
                            to   { opacity:1; transform:scale(1) translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
}
