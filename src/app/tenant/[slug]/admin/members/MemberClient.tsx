'use client';

import { useState, useTransition } from 'react';
import { createMember } from '@/app/actions/member-actions';

interface Member {
    id: string;
    name: string;
    email?: string | null;
    rut?: string | null;
    discount: number;
}

interface MemberClientProps {
    initialMembers: Member[];
}

export default function MemberClient({ initialMembers }: MemberClientProps) {
    const [members, setMembers] = useState(initialMembers);
    const [showModal, setShowModal] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Form State
    const [formData, setFormData] = useState({ name: '', email: '', rut: '', discount: 0 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await createMember(formData);
            if (res.success) {
                alert("Socio creado exitosamente!");
                setShowModal(false);
                setFormData({ name: '', email: '', rut: '', discount: 0 });
                // Optimistic update could go here, or full refresh via parent/action revalidation
                // Since action revalidates path, a full page refresh happens implicitly in Next.js server actions usually
                // But for client state consistency, we might want to refetch or just push to local state if we returned the created obj
                window.location.reload();
            } else {
                alert("Error al crear socio: " + res.error);
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT / ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.rut || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{member.discount}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email || '-'}</td>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email (Opcional)</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
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
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isPending ? 'Guardando...' : 'Guardar Socio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
