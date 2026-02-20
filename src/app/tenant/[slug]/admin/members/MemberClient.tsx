'use client';

import { useState, useTransition } from 'react';
import { createMember } from '@/app/actions/member-actions';
import { createMembershipPayment } from '@/app/actions/membership-actions';
import { createMemberCheckoutSession } from '@/app/actions/payment-actions';

interface MembershipPlan {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
}

interface Member {
    id: string;
    name: string;
    email?: string | null;
    rut?: string | null;
    discount: number;
    subscriptionStatus: 'ACTIVE' | 'IN_ARREARS' | 'CANCELLED';
    currentPeriodEnd?: Date | null;
    membershipPlan?: MembershipPlan | null;
}

interface MemberClientProps {
    initialMembers: Member[];
    plans: MembershipPlan[]; // Traídos para el modal de creación
}

export default function MemberClient({ initialMembers, plans }: MemberClientProps) {
    const [members, setMembers] = useState(initialMembers);
    const [showModal, setShowModal] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Form State
    const [formData, setFormData] = useState({ name: '', email: '', rut: '', discount: 0, membershipPlanId: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await createMember(formData);
            if (res.success) {
                alert("Socio creado exitosamente!");
                setShowModal(false);
                setFormData({ name: '', email: '', rut: '', discount: 0, membershipPlanId: '' });
                // Optimistic update could go here, or full refresh via parent/action revalidation
                // Since action revalidates path, a full page refresh happens implicitly in Next.js server actions usually
                // But for client state consistency, we might want to refetch or just push to local state if we returned the created obj
                window.location.reload();
            } else {
                alert("Error al crear socio: " + res.error);
            }
        });
    };

    // Vanguard Link Manager
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    const handlePayment = async (memberId: string) => {
        if (!confirm('¿Registrar pago LOCAL de cuota social? (Genera DTE y activa el Socio)')) return;

        startTransition(async () => {
            const res = await createMembershipPayment(memberId);
            if (res.success) {
                alert('Pago exitoso y DTE generado. Ciclo de facturación renovado.');
                window.location.reload();
            } else {
                alert(`Error en pago: ${res.error}`);
            }
        });
    };

    const handleExternalPayment = async (memberId: string) => {
        startTransition(async () => {
            const res = await createMemberCheckoutSession(memberId);
            if (res.success && res.paymentUrl) {
                setCheckoutUrl(res.paymentUrl);
            } else {
                alert(`Error conectando con la pasarela: ${res.error}`);
            }
        });
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="mb-6 flex justify-between">
                <input
                    type="text"
                    placeholder="Buscar socio..."
                    className="border rounded-lg px-4 py-2 w-64"
                />
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    + Nuevo Socio
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan / Discount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Cuota</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-900">{member.name}</div>
                                    <div className="text-xs text-gray-500">{member.rut || member.email || 'Sin ID'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {member.membershipPlan ? (
                                        <div className="text-sm text-gray-900">{member.membershipPlan.name}</div>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic">Sin Suscripción</div>
                                    )}
                                    <div className="text-xs text-green-600 font-bold">{member.discount}% off mesas</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {member.subscriptionStatus === 'ACTIVE' ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Al Día
                                        </span>
                                    ) : member.subscriptionStatus === 'IN_ARREARS' ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            Moroso
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            Cancelado
                                        </span>
                                    )}
                                    {member.currentPeriodEnd && (
                                        <div className="text-xs text-gray-500 mt-1">Vence: {new Date(member.currentPeriodEnd).toLocaleDateString()}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {member.membershipPlan && member.subscriptionStatus !== 'ACTIVE' && (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handlePayment(member.id)}
                                                disabled={isPending}
                                                className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-md font-bold text-xs"
                                                title="Forzar Pago Local + DTE"
                                            >
                                                Pagar (Local)
                                            </button>
                                            <button
                                                onClick={() => handleExternalPayment(member.id)}
                                                disabled={isPending}
                                                className="text-white hover:bg-[var(--theme-primary-hover)] bg-[var(--theme-primary)] px-3 py-1.5 rounded-md font-bold text-xs"
                                                title="Obtener Link de Pasarela de Pago Seguro"
                                            >
                                                Link Checkout
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">No hay socios registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Nuevo Socio</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                <input
                                    type="text"
                                    id="memberName"
                                    name="memberName"
                                    placeholder="Ej: John Doe"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RUT / ID</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.rut}
                                        onChange={e => setFormData({ ...formData, rut: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Descuento (%)</label>
                                    <input
                                        type="number"
                                        min="0" max="100"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.discount}
                                        onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email (Opcional)</label>
                                    <input
                                        type="email"
                                        id="memberEmail"
                                        name="memberEmail"
                                        placeholder="ejemplo@email.com"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-indigo-700 mb-1">Plan de Suscripción</label>
                                    <select
                                        className="w-full border-2 border-indigo-100 rounded-lg shadow-sm p-2 outline-none focus:border-indigo-500 bg-indigo-50/50"
                                        value={formData.membershipPlanId}
                                        onChange={e => setFormData({ ...formData, membershipPlanId: e.target.value })}
                                    >
                                        <option value="">Sin Cuota Fija (Free)</option>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-hover)] disabled:opacity-50"
                                >
                                    {isPending ? 'Guardando...' : 'Guardar Socio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Link de Pago Modal */}
            {checkoutUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-xl p-8 w-full max-w-lg text-center shadow-2xl relative">
                        <div className="text-4xl absolute -top-5 bg-[var(--theme-primary)] rounded-full w-14 h-14 flex items-center justify-center text-white left-1/2 -translate-x-1/2 border-4 border-white">
                            💳
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mt-4 mb-2">Checkout Generado</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Envía este link al socio para que realice el pago seguro. El sistema se actualizará automáticamente y emitirá la boleta SII una vez confirmado.
                        </p>

                        <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between border border-gray-200">
                            <span className="text-xs text-gray-700 truncate mr-4 font-mono select-all">
                                {window.location.origin}{checkoutUrl}
                            </span>
                            <button
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${checkoutUrl}`)}
                                className="bg-white border shadow-sm px-3 py-1.5 rounded-md text-xs font-bold hover:bg-gray-50 flex-shrink-0 whitespace-nowrap"
                            >
                                Copiar Link
                            </button>
                        </div>

                        <div className="mt-8">
                            <a
                                href={checkoutUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full block text-center px-4 py-3 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-hover)] font-bold mb-3 shadow-md shadow-[var(--theme-primary-transparent)] transition-all"
                            >
                                Ir a Pantalla de Pago (Mock)
                            </a>
                            <button
                                onClick={() => setCheckoutUrl(null)}
                                className="w-full px-4 py-3 text-gray-500 font-medium hover:text-gray-800 transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
