'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLegalConfig } from '@/app/actions/legal-actions';
import { formatRut, validateRut } from '@/lib/chile/rut-validator';

interface LegalConfigPanelProps {
    currentRutEmisor: string;
    currentRazonSocial: string;
    currentGiro: string;
    currentDirTributaria: string;
}

export default function LegalConfigPanel({
    currentRutEmisor,
    currentRazonSocial,
    currentGiro,
    currentDirTributaria
}: LegalConfigPanelProps) {
    const router = useRouter();

    const [rut, setRut] = useState(formatRut(currentRutEmisor || ''));
    const [razon, setRazon] = useState(currentRazonSocial || '');
    const [giro, setGiro] = useState(currentGiro || '');
    const [dirtrib, setDirtrib] = useState(currentDirTributaria || '');

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const formatted = formatRut(raw);
        setRut(formatted);
        if (formatted.length > 7 && !validateRut(formatted)) {
            setError('Módulo 11 Inválido. Digito Verificador incorrecto.');
        } else {
            setError('');
        }
    };

    const handleSave = async () => {
        if (!rut || !validateRut(rut)) {
            setError('Debes ingresar un RUT válido.');
            return;
        }
        if (!razon.trim() || !giro.trim() || !dirtrib.trim()) {
            setError('Todos los campos legales son obligatorios para emitir DTE.');
            return;
        }

        setSaving(true);
        setError('');
        const res = await updateLegalConfig(rut, razon, giro, dirtrib);
        setSaving(false);

        if (res.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            router.refresh();
        } else {
            setError(res.error || 'Error guardando datos legales');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-8">
            <div className="px-6 py-4 bg-gray-900 border-b border-gray-800">
                <h2 className="font-black text-white text-sm uppercase tracking-widest flex items-center gap-2">
                    ⚖️ Perfil Emisor (SII Connect)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Información Legal y Tributaria Oficial de tu Empresa.</p>
            </div>

            <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                            RUT Empresa / Emisor
                            {rut.length > 7 && validateRut(rut) && <span className="text-emerald-500">M11 OK ✓</span>}
                        </label>
                        <input
                            type="text"
                            value={rut}
                            onChange={handleRutChange}
                            placeholder="76.123.456-K"
                            maxLength={12}
                            className={`w-full px-4 py-2 border-2 rounded-xl text-sm font-bold focus:outline-none transition-colors ${rut.length > 7 && !validateRut(rut) ? 'border-rose-300 text-rose-700 bg-rose-50' : 'border-gray-200 text-gray-800 focus:border-gray-900'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Razón Social Oficial
                        </label>
                        <input
                            type="text"
                            value={razon}
                            onChange={e => setRazon(e.target.value.toUpperCase())}
                            placeholder="COMERCIALIZADORA SPA"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:border-gray-900 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Giro Principal (Actividad)
                        </label>
                        <input
                            type="text"
                            value={giro}
                            onChange={e => setGiro(e.target.value.toUpperCase())}
                            placeholder="SERVICIOS DE ENTRETENIMIENTO"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:border-gray-900 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Dirección Tributaria (Casa Matriz)
                        </label>
                        <input
                            type="text"
                            value={dirtrib}
                            onChange={e => setDirtrib(e.target.value.toUpperCase())}
                            placeholder="AV PROVIDENCIA 1234, SANTIAGO"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:border-gray-900 outline-none"
                        />
                    </div>
                </div>

                {error && <p className="text-sm text-rose-600 font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}

                <div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving || saved || (rut.length > 7 && !validateRut(rut))}
                        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-colors disabled:opacity-60 ${saved ? 'bg-emerald-600 text-white' : 'bg-gray-900 hover:bg-gray-700 text-white'}`}
                    >
                        {saving ? '⏳ Guardando...' : saved ? '✅ Datos Oficiales Guardados' : '💾 Activar Perfil SII'}
                    </button>
                </div>
            </div>
        </div>
    );
}
