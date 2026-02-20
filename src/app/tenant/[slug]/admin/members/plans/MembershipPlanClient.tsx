'use client';

import { useState } from 'react';
import { createMembershipPlan, deleteMembershipPlan } from '@/app/actions/membership-actions';

interface Plan {
    id: string;
    name: string;
    price: number;
    isTaxable: boolean;
    billingCycle: 'MONTHLY' | 'YEARLY';
    _count?: { members: number };
}

export default function MembershipPlanClient({ initialPlans }: { initialPlans: Plan[] }) {
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [isTaxable, setIsTaxable] = useState(false); // Por defecto Exento para Clubes
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

    // UI
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || Number(price) <= 0) {
            setError('Faltan datos o precio inválido.');
            return;
        }

        setSaving(true);
        const res = await createMembershipPlan({
            name,
            price: Number(price),
            isTaxable,
            billingCycle
        });
        setSaving(false);

        if (res.success) {
            setIsAdding(false);
            // Optimistic reload (simulated, server revalidates)
            window.location.reload();
        } else {
            setError(res.error || 'Error al guardar');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar el plan ${name}?\nEsta acción es irreversible.`)) return;

        const res = await deleteMembershipPlan(id);
        if (res.success) {
            setPlans(plans.filter(p => p.id !== id));
        } else {
            alert(res.error || 'No se pudo eliminar el plan.');
        }
    };

    return (
        <div className="space-y-6">
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl font-bold bg-indigo-50/50 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                    <span className="text-xl">+</span> Crear Nuevo Plan de Cuota
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <h3 className="font-bold text-gray-900 mb-4">✨ Nuevo Plan de Suscripción</h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Plan</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ej: Cuota Social Básica"
                                    className="w-full p-2 border-2 border-gray-100 rounded-lg focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Bruto</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        placeholder="10000"
                                        className="w-full pl-8 p-2 border-2 border-gray-100 rounded-lg focus:border-indigo-500 outline-none font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {/* Toggle de Afecto a IVA */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Tratamiento de IVA</label>
                                    <p className="text-[10px] text-gray-400 mt-1 mb-3">Las Cuotas de Clubes sin fines de lucro suelen estar exentas.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsTaxable(false)}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${!isTaxable ? 'bg-[var(--theme-primary)] text-white shadow' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                    >
                                        🚫 Exento (DTE 41)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsTaxable(true)}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${isTaxable ? 'bg-red-500 text-white shadow' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                    >
                                        🧾 Afecto a IVA
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase">Ciclo de Cobro</label>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setBillingCycle('MONTHLY')}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${billingCycle === 'MONTHLY' ? 'bg-[var(--theme-primary)] text-white shadow' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                    >
                                        📅 Mensual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBillingCycle('YEARLY')}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${billingCycle === 'YEARLY' ? 'bg-[var(--theme-primary)] text-white shadow' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                    >
                                        🗓️ Anual
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 font-bold bg-red-50 p-2 rounded">{error}</p>}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-bold text-white bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] rounded-lg transition-colors shadow-sm disabled:opacity-50">
                                {saving ? 'Guardando...' : 'Guardar Plan'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-gray-900">{plan.name}</h4>
                                <p className="text-xs font-medium text-gray-500 capitalize">Ciclo {plan.billingCycle.toLowerCase()}</p>
                            </div>
                            <button onClick={() => handleDelete(plan.id, plan.name)} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Plan">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>

                        <div className="flex items-end justify-between">
                            <div className="font-mono text-2xl font-black text-indigo-700">
                                ${plan.price.toLocaleString('es-CL')}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {plan.isTaxable ? (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Afecto IVA</span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Exento DTE 41</span>
                                )}
                                <span className="text-[10px] text-gray-400 font-medium">{plan._count?.members || 0} Socios Activos</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
