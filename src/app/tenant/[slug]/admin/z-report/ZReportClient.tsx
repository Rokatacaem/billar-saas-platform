'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { closeShift } from '@/app/actions/z-report-actions';
import { sendZReportEmail } from '@/app/actions/z-report-email';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Balance {
    id: string;
    date: string;
    totalRevenue: number;
    timeRevenue: number;
    productRevenue: number;
    membershipRevenue: number;
    rentalRevenue: number;
    cashRevenue: number;
    cardRevenue: number;
    creditRevenue: number;
    totalCost: number;
    wasteCost: number;
    maintenanceCost: number;
    netProfit: number;
    cashInHand: number | null;
    cashDifference: number | null;
    hasCashAlert: boolean;
    closedBy: string;
    notes: string | null;
    status: string;
    _count: { usageLogs: number };
}

interface ZReportClientProps {
    balances: Balance[];
    pendingCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
});

// ─── Sub-components ───────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent }: {
    label: string; value: string; sub?: string;
    accent?: 'green' | 'red' | 'blue' | 'amber';
}) {
    const colors = {
        green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        red: 'text-rose-600 bg-rose-50 border-rose-100',
        blue: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
    };
    const cls = accent ? colors[accent] : 'text-gray-700 bg-gray-50 border-gray-100';
    return (
        <div className={`rounded-xl border p-4 ${cls}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
            <p className="text-xl font-black mt-1">{value}</p>
            {sub && <p className="text-[11px] mt-0.5 opacity-70">{sub}</p>}
        </div>
    );
}

// ─── Botones de Exportación ───────────────────────────────────────────────────
function ExportButtons({ balance, tenantName }: { balance: Balance; tenantName?: string }) {
    const [emailSending, setEmailSending] = useState(false);
    const [emailDone, setEmailDone] = useState(false);

    const handleDownloadTicket = async () => {
        // Dynamic import para evitar SSR de jsPDF
        const { downloadTicketPDF } = await import('@/lib/reports/generate-pdf');
        downloadTicketPDF({
            ...balance,
            sessionCount: balance._count.usageLogs,
        }, tenantName ?? 'Club');
    };

    const handleDownloadExecutive = async () => {
        const { downloadExecutivePDF } = await import('@/lib/reports/generate-pdf');
        downloadExecutivePDF({
            ...balance,
            sessionCount: balance._count.usageLogs,
        }, tenantName ?? 'Club');
    };

    const handleSendEmail = async () => {
        setEmailSending(true);
        await sendZReportEmail(balance.id);
        setEmailSending(false);
        setEmailDone(true);
        setTimeout(() => setEmailDone(false), 4000);
    };

    return (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <button
                onClick={handleDownloadTicket}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Descargar en formato ticketera 80mm"
            >
                🖨️ Ticket
            </button>
            <button
                onClick={handleDownloadExecutive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                title="Descargar Reporte Ejecutivo A4 con gráficos"
            >
                📊 PDF A4
            </button>
            <button
                onClick={handleSendEmail}
                disabled={emailSending || emailDone}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${emailDone
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    } disabled:opacity-60`}
                title="Enviar copia por email al administrador"
            >
                {emailSending ? '⏳ Enviando...' : emailDone ? '✅ Enviado' : '✉️ Email'}
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ZReportClient({ balances, pendingCount }: ZReportClientProps) {
    const router = useRouter();

    // Modal States
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [cashInput, setCashInput] = useState('');
    const [notes, setNotes] = useState('');
    const [step, setStep] = useState<'blind' | 'result'>('blind');
    const [closeResult, setCloseResult] = useState<{
        hasCashAlert: boolean;
        cashDifference: number;
        summary: { totalRevenue: number; netProfit: number; sessionCount: number };
        balanceId: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Detail View State
    const [selectedBalance, setSelectedBalance] = useState<Balance | null>(null);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleViewDetail = (balance: Balance) => {
        setSelectedBalance(prev => prev?.id === balance.id ? null : balance);
    };

    const handleCloseShift = async () => {
        const cash = parseFloat(cashInput);
        if (isNaN(cash)) { setError('Ingresa un monto válido.'); return; }
        setIsLoading(true);
        setError('');
        try {
            const result = await closeShift({ cashInHand: cash, notes });
            if (!result.success) {
                setError(result.error || 'Error desconocido');
            } else if (result.summary) {
                setCloseResult({
                    hasCashAlert: result.hasCashAlert!,
                    cashDifference: result.cashDifference!,
                    summary: result.summary,
                    balanceId: result.balanceId!
                });
                setStep('result');
                router.refresh();
            }
        } catch {
            setError('Error al procesar el cierre.');
        }
        setIsLoading(false);
    };

    const resetModal = () => {
        setShowCloseModal(false);
        setStep('blind');
        setCashInput('');
        setNotes('');
        setCloseResult(null);
        setError('');
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Action Bar */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { setShowCloseModal(true); setStep('blind'); }}
                    disabled={pendingCount === 0}
                    className="relative px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                    {pendingCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                            {pendingCount}
                        </span>
                    )}
                    🔒 Cerrar Turno (Z-Report)
                </button>
            </div>

            {/* Historial de Cierres */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Historial de Cierres</h2>
                </div>
                {balances.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-400">
                        <p className="text-4xl mb-3">📊</p>
                        <p className="font-medium">No hay cierres registrados aún.</p>
                        <p className="text-sm">Cierra tu primer turno para verlo aquí.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {balances.map((b) => (
                            <div key={b.id}>
                                {/* Fila de resumen */}
                                <div
                                    onClick={() => handleViewDetail(b)}
                                    className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between ${selectedBalance?.id === b.id ? 'bg-indigo-50' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        {b.hasCashAlert ? (
                                            <span title="Descuadre detectado" className="text-rose-500 text-lg">🚩</span>
                                        ) : (
                                            <span className="text-emerald-500 text-lg">✅</span>
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{fmtDate(b.date)}</p>
                                            <p className="text-xs text-gray-400">{b._count.usageLogs} sesiones · Cerrado por {b.closedBy}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900">{fmt(b.totalRevenue)}</p>
                                        <p className={`text-xs font-bold ${b.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            Neto: {fmt(b.netProfit)}
                                        </p>
                                    </div>
                                </div>

                                {/* Panel de Detalle con Exportación */}
                                {selectedBalance?.id === b.id && (
                                    <div className="px-6 py-5 bg-indigo-50/50 border-t border-indigo-100">
                                        {/* Sentinel Alert */}
                                        {b.hasCashAlert && (
                                            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl mb-4">
                                                <span className="text-2xl">🚩</span>
                                                <div>
                                                    <p className="font-black text-rose-700 text-sm">ALERTA SENTINEL: Descuadre de Caja</p>
                                                    <p className="text-xs text-rose-600">
                                                        {(b.cashDifference || 0) > 0 ? 'Sobran' : 'Faltan'} {fmt(Math.abs(b.cashDifference || 0))} ·
                                                        Teórico: {fmt(b.cashRevenue)} · Declarado: {fmt(b.cashInHand || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Revenue Streams */}
                                        <div className="mb-4">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Revenue Streams</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <MetricCard label="Tiempo de Juego" value={fmt(b.timeRevenue)} accent="blue" />
                                                <MetricCard label="Bar / Cocina" value={fmt(b.productRevenue)} accent="blue" />
                                                <MetricCard label="Cuotas Sociales" value={fmt(b.membershipRevenue)} />
                                                <MetricCard label="Arriendos" value={fmt(b.rentalRevenue)} />
                                            </div>
                                        </div>

                                        {/* Payment Reconciliation */}
                                        <div className="mb-4">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Conciliación de Pagos</h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                <MetricCard label="💵 Efectivo" value={fmt(b.cashRevenue)} accent="green" />
                                                <MetricCard label="💳 Tarjeta / Digital" value={fmt(b.cardRevenue)} accent="green" />
                                                <MetricCard label="📒 Crédito / Socio" value={fmt(b.creditRevenue)} />
                                            </div>
                                        </div>

                                        {/* Bottom Line */}
                                        <div className="mb-4">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Egresos y Utilidad</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <MetricCard label="COGS (Insumos)" value={fmt(b.totalCost)} accent="amber" />
                                                <MetricCard label="Mermas" value={fmt(b.wasteCost)} accent="amber" />
                                                <MetricCard label="Mantenimiento" value={fmt(b.maintenanceCost)} accent="amber" />
                                                <MetricCard
                                                    label="UTILIDAD NETA"
                                                    value={fmt(b.netProfit)}
                                                    accent={b.netProfit >= 0 ? 'green' : 'red'}
                                                    sub={`${((b.netProfit / (b.totalRevenue || 1)) * 100).toFixed(1)}% margen`}
                                                />
                                            </div>
                                        </div>

                                        {/* Notas */}
                                        {b.notes && (
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-3">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notas del Cajero</p>
                                                <p className="text-sm text-gray-700">{b.notes}</p>
                                            </div>
                                        )}

                                        {/* Botones de Exportación */}
                                        <ExportButtons balance={b} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════
                MODAL: CIERRE DE TURNO (ARQUEO CIEGO)
            ═══════════════════════════════════════════ */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

                        {/* Step 1: Arqueo Ciego */}
                        {step === 'blind' && (
                            <>
                                <div className="px-6 py-5 bg-gray-900 text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-black text-lg">🔒 Cierre de Turno</h3>
                                            <p className="text-gray-400 text-xs mt-1">Arqueo Ciego — ingresa el efectivo real antes de ver el sistema</p>
                                        </div>
                                        <button onClick={resetModal} className="text-gray-400 hover:text-white font-bold">&times;</button>
                                    </div>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-xs font-bold text-amber-700">⚠️ Protocolo de Arqueo Ciego</p>
                                        <p className="text-xs text-amber-600 mt-1">Cuenta el efectivo en el cajón y escribe el total. El sistema comparará con el monto teórico <strong>después</strong> de que confirmes.</p>
                                    </div>

                                    <div>
                                        <label htmlFor="cash-input" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            Efectivo Contado en Caja
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input
                                                id="cash-input"
                                                type="number"
                                                step="1"
                                                value={cashInput}
                                                onChange={e => setCashInput(e.target.value)}
                                                placeholder="0"
                                                className="w-full pl-7 pr-4 py-3 border-2 rounded-xl text-2xl font-black text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="shift-notes" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            Notas del Turno (Opcional)
                                        </label>
                                        <textarea
                                            id="shift-notes"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={2}
                                            placeholder="Incidencias, observaciones..."
                                            className="w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none resize-none"
                                        />
                                    </div>

                                    {error && <p className="text-sm text-rose-600 font-bold">{error}</p>}
                                </div>
                                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                                    <button onClick={resetModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm">Cancelar</button>
                                    <button
                                        onClick={handleCloseShift}
                                        disabled={isLoading || !cashInput}
                                        className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700 disabled:opacity-50 text-sm transition-colors"
                                    >
                                        {isLoading ? 'Procesando...' : 'Consolidar Turno'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 2: Resultado */}
                        {step === 'result' && closeResult && (
                            <>
                                <div className={`px-6 py-5 ${closeResult.hasCashAlert ? 'bg-rose-600' : 'bg-emerald-600'} text-white`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-black text-xl">{closeResult.hasCashAlert ? '🚩 Descuadre Detectado' : '✅ Turno Cerrado'}</h3>
                                            <p className="text-white/70 text-xs mt-1">{closeResult.summary.sessionCount} sesiones consolidadas</p>
                                        </div>
                                        <button onClick={resetModal} className="text-white/60 hover:text-white font-bold">&times;</button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {closeResult.hasCashAlert && (
                                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                                            <p className="font-black text-rose-700">
                                                {closeResult.cashDifference > 0 ? '⬆️ Sobran' : '⬇️ Faltan'} {fmt(Math.abs(closeResult.cashDifference))}
                                            </p>
                                            <p className="text-xs text-rose-600 mt-1">Sentinel ha registrado este descuadre. El administrador será notificado.</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <MetricCard label="Ingresos Totales" value={fmt(closeResult.summary.totalRevenue)} accent="blue" />
                                        <MetricCard
                                            label="Utilidad Neta"
                                            value={fmt(closeResult.summary.netProfit)}
                                            accent={closeResult.summary.netProfit >= 0 ? 'green' : 'red'}
                                        />
                                    </div>

                                    {/* Acciones de descarga post-cierre */}
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descargar Reporte</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    const found = balances.find(b => b.id === closeResult.balanceId);
                                                    if (found) {
                                                        const { downloadTicketPDF } = await import('@/lib/reports/generate-pdf');
                                                        downloadTicketPDF({ ...found, sessionCount: found._count.usageLogs }, 'Club');
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                                            >
                                                🖨️ Ticket
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const found = balances.find(b => b.id === closeResult.balanceId);
                                                    if (found) {
                                                        const { downloadExecutivePDF } = await import('@/lib/reports/generate-pdf');
                                                        downloadExecutivePDF({ ...found, sessionCount: found._count.usageLogs }, 'Club');
                                                    }
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg"
                                            >
                                                📊 PDF A4
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50 flex justify-end">
                                    <button onClick={resetModal} className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700 text-sm">Aceptar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
