'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateBasicTenantInfo } from '@/app/actions/admin-actions';
import { uploadLogo } from '@/app/actions/upload-actions';
import { Palette, Building2, Layout } from 'lucide-react';

export function EditTenantForm({ tenant }: { tenant: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: tenant.name,
        type: tenant.type,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        backgroundColor: tenant.backgroundColor,
        logoUrl: tenant.logoUrl || '',
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const { url } = await uploadLogo(data);
            setFormData(prev => ({ ...prev, logoUrl: url }));
            toast.success('Logo subido');
        } catch (error) {
            toast.error('Error al subir logo');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });

        try {
            await updateBasicTenantInfo(tenant.id, data);
            toast.success('Cambios guardados');
            router.push('/admin/tenants');
            router.refresh();
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-500" /> Datos Generales
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Club</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-1 block w-auto w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Negocio</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                            className="mt-1 block w-auto w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="BUSINESS">Business (Venta directa)</option>
                            <option value="CLUB">Club (Membresías)</option>
                        </select>
                    </div>
                </div>

                {/* Branding */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-500" /> Identidad Visual
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium">Color Principal</label>
                            <input
                                type="color"
                                value={formData.primaryColor}
                                onChange={e => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="mt-1 block w-full h-10 rounded-md cursor-pointer"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium">Fondo</label>
                            <input
                                type="color"
                                value={formData.backgroundColor}
                                onChange={e => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                                className="mt-1 block w-full h-10 rounded-md cursor-pointer"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Logo</label>
                        <div className="mt-1 flex items-center gap-4">
                            {formData.logoUrl && (
                                <img src={formData.logoUrl} alt="Logo" className="w-12 h-12 rounded object-contain border bg-gray-50" />
                            )}
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                accept="image/*"
                                disabled={uploading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Preview */}
            <div className="mt-8 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50">
                <h4 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Vista Previa del Tema
                </h4>
                <div
                    className="p-8 rounded-lg shadow-sm border"
                    style={{ backgroundColor: formData.backgroundColor }}
                >
                    <div className="flex items-center gap-4 mb-4">
                        {formData.logoUrl ? (
                            <img src={formData.logoUrl} alt="logo" className="h-8 w-8 object-contain" />
                        ) : (
                            <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
                        )}
                        <h2 className="text-xl font-bold" style={{ color: formData.primaryColor }}>
                            {formData.name || 'Nombre del Club'}
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 w-24 rounded" style={{ backgroundColor: formData.primaryColor }} />
                        <div className="h-8 w-24 rounded border border-gray-200 bg-white" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t dark:border-gray-700">
                <button
                    type="submit"
                    disabled={loading || uploading}
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    );
}
