'use client';

import { useState } from 'react';
import { updateTaxConfig } from '@/app/actions/tax-actions';
import { useRouter } from 'next/navigation';

// Tabla de referencia de impuestos por país
const TAX_PRESETS = [
    { label: '🇨🇱 Chile — IVA', name: 'IVA', pct: 19 },
    { label: '🇵🇪 Perú — IGV', name: 'IGV', pct: 18 },
    { label: '🇲🇽 México — IVA', name: 'IVA', pct: 16 },
    { label: '🇨🇴 Colombia — IVA', name: 'IVA', pct: 19 },
    { label: '🌍 Exportación — Exento', name: 'EXN', pct: 0 },
    { label: '🏷️ Personalizado', name: '', pct: -1 },
];

interface TaxConfigPanelProps {
    currentTaxPercentage: number;
    currentTaxName: string;
    currentIsTaxExempt: boolean;
    currencyCode: string;
}

export default function TaxConfigPanel({
    currentTaxPercentage,
    currentTaxName,
    currentIsTaxExempt,
    currencyCode,
}: TaxConfigPanelProps) {
    const router = useRouter();
    const [taxPct, setTaxPct] = useState(currentTaxPercentage);
    const [taxName, setTaxName] = useState(currentTaxName);
    const [isExempt, setIsExempt] = useState(currentIsTaxExempt);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handlePreset = (pct: number, name: string, exempt: boolean) => {
        if (pct >= 0) {
            setTaxPct(pct);
            if (name) setTaxName(name);
        }
        setIsExempt(exempt);
        setError('');
    };

    const handleSave = async () => {
        if (taxPct < 0 || taxPct > 100) {
            setError('El porcentaje debe estar entre 0 y 100.');
            return;
        }
        if (!taxName.trim()) {
            setError('El nombre del impuesto es obligatorio.');
            return;
        }
        setSaving(true);
        setError('');
        const result = await updateTaxConfig(taxPct, taxName, isExempt);
        setSaving(false);
        if (result.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            router.refresh();
        } else {
            setError(result.error || 'Error al guardar.');
        }
    };

    // Vista previa del cálculo
    const sampleTotal = 10000;
    const taxRate = taxPct / 100;
    const netSample = taxRate > 0 ? sampleTotal / (1 + taxRate) : sampleTotal;
    const taxSample = sampleTotal - netSample;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <h2 className="font-black text-gray-800 text-sm uppercase tracking-widest">🧾 Configuración Fiscal</h2>
                <p className="text-xs text-gray-500 mt-0.5">Moneda activa: <strong>{currencyCode}</strong></p>
            </div>

            <div className="p-6 space-y-6">
                {/* Presets */}
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Presets Regionales</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {TAX_PRESETS.map((p) => (
                            <button
                                key={p.label}
                                onClick={() => p.pct >= 0
                                    ? handlePreset(p.pct, p.name, p.pct === 0)
                                    : undefined
                                }
                                className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-colors text-left ${taxPct === p.pct && (p.name === taxName || p.pct === -1)
                                    ? 'border-gray-900 bg-gray-900 text-white'
                                    : 'border-gray-200 hover:border-gray-400 text-gray-700'
                                    }`}
                            >
                                <span className="block">{p.label}</span>
                                {p.pct >= 0 && (
                                    <span className="block text-[10px] font-normal opacity-70">
                                        {p.pct === 0 ? 'Exento' : `${p.name} ${p.pct}%`}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Campos Manuales */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tax-name" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Nombre del Impuesto
                        </label>
                        <input
                            id="tax-name"
                            type="text"
                            value={taxName}
                            onChange={e => setTaxName(e.target.value.toUpperCase())}
                            maxLength={10}
                            placeholder="IVA"
                            className="w-full px-4 py-2 border-2 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="tax-pct" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Porcentaje (%)
                        </label>
                        <div className="relative">
                            <input
                                id="tax-pct"
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={taxPct}
                                onChange={e => setTaxPct(Number(e.target.value))}
                                className="w-full px-4 py-2 border-2 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                        </div>
                    </div>
                </div>

                {/* Toggle Exento */}
                <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex-1">
                        <p className="font-bold text-amber-800 text-sm">Tenant Exento de Impuesto</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            Marcar si emites <strong>Boletas Exentas</strong> (SII Art. 12 D). Sentinel no generará alerta por 0%.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsExempt(!isExempt)}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${isExempt ? 'bg-emerald-500' : 'bg-gray-200'
                            }`}
                        aria-label="Toggle exento de impuesto"
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isExempt ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                    </button>
                </div>

                {/* Vista Previa */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Vista Previa — Ejemplo $10.000</p>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Neto</span>
                        <span className="font-bold">${Math.round(netSample).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">{taxName || 'Impuesto'} ({taxPct}%)</span>
                        <span className="font-bold text-amber-600">+${Math.round(taxSample).toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                        <span className="font-black text-gray-900">Total con {taxName || 'Impuesto'}</span>
                        <span className="font-black text-gray-900">${sampleTotal.toLocaleString('es-CL')}</span>
                    </div>
                </div>

                {/* Alerta Sentinel preview */}
                {taxPct === 0 && !isExempt && (
                    <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="text-xl mt-0.5">🚩</span>
                        <div>
                            <p className="font-black text-rose-700 text-sm">Alerta Sentinel activa</p>
                            <p className="text-xs text-rose-600 mt-1">Con 0% y sin marcar como exento, Sentinel emitirá una alerta cada vez que se cobre una sesión. Activa &quot;Exento&quot; si corresponde a Boleta Exenta.</p>
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-rose-600 font-bold">{error}</p>}

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-colors disabled:opacity-60 ${saved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-900 hover:bg-gray-700 text-white'
                            }`}
                    >
                        {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>
    );
}
