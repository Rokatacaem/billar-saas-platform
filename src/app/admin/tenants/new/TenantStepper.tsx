'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Palette,
    UserPlus,
    ChevronRight,
    ChevronLeft,
    Check,
    AlertCircle,
    LayoutDashboard,
    Briefcase,
    ShieldCheck,
    Upload,
    Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import { validateThemeContrast } from '@/lib/theme-generator';
import { createTenantWithAssets } from '@/app/actions/admin-actions';
import { uploadLogo } from '@/app/actions/upload-actions';

/**
 * Utility for Tailwind classes
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const STEPS = [
    { id: 1, title: 'Datos Base', icon: Building2 },
    { id: 2, title: 'Negocio', icon: Briefcase },
    { id: 3, title: 'Identidad', icon: Palette },
    { id: 4, title: 'Acceso', icon: ShieldCheck },
];

export default function TenantStepper() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        country: 'CL',
        type: 'BUSINESS',
        primaryColor: '#4f46e5',
        backgroundColor: '#ffffff',
        logoUrl: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        plan: 'BASIC'
    });

    // Auto-slug effect
    useEffect(() => {
        if (currentStep === 1 && formData.name && !formData.slug) {
            const generatedSlug = formData.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            setFormData(prev => ({ ...prev, slug: generatedSlug }));
        }
    }, [formData.name, currentStep, formData.slug]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const validateCurrentStep = () => {
        if (currentStep === 1) {
            if (!formData.name || !formData.slug) {
                toast.error('Nombre y Slug son obligatorios');
                return false;
            }
        }
        if (currentStep === 4) {
            if (!formData.adminEmail || !formData.adminPassword) {
                toast.error('Credenciales de acceso son obligatorias');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => data.append(key, value));

        try {
            await createTenantWithAssets(data);
            toast.success('¡Tenant creado con éxito!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al crear tenant');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Stepper Header */}
            <nav className="mb-12">
                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 -z-10" />
                    <ol className="flex items-center justify-between">
                        {STEPS.map((step) => {
                            const Icon = step.icon;
                            const isCompleted = currentStep > step.id;
                            const isActive = currentStep === step.id;

                            return (
                                <li key={step.id} className="bg-white px-4 relative flex flex-col items-center">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                            isCompleted ? "bg-green-500 border-green-500 text-white" :
                                                isActive ? "border-indigo-600 text-indigo-600 ring-4 ring-indigo-100" :
                                                    "border-gray-300 text-gray-400"
                                        )}
                                    >
                                        {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className={cn(
                                        "absolute mt-12 hidden sm:block text-xs font-medium whitespace-nowrap",
                                        isActive ? "text-indigo-600" : "text-gray-500"
                                    )}>
                                        {step.title}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </nav>

            {/* Step Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-8 flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {currentStep === 1 && (
                                <Step1Data data={formData} onChange={handleInputChange} />
                            )}
                            {currentStep === 2 && (
                                <Step2Business data={formData} onSelect={(val: string) => setFormData(p => ({ ...p, type: val as any }))} />
                            )}
                            {currentStep === 3 && (
                                <Step3Branding data={formData} onChange={handleInputChange} setFormData={setFormData} />
                            )}
                            {currentStep === 4 && (
                                <Step4Access data={formData} onChange={handleInputChange} onSelectPlan={(val: string) => setFormData(p => ({ ...p, plan: val as any }))} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1 || isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 disabled:opacity-0 transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    {currentStep < STEPS.length ? (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                        >
                            Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-md shadow-green-200 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? 'Provisionando...' : 'Finalizar y Crear'} <Check className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SUBCOMPONENTS FOR STEPS ---

function Step1Data({ data, onChange }: { data: any, onChange: (e: any) => void }) {
    return (
        <div className="space-y-6">
            <header>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Datos del Establecimiento</h3>
                <p className="text-sm text-gray-500">Comencemos con lo básico para identificar tu negocio.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nombre del Local</label>
                    <input
                        name="name"
                        value={data.name}
                        onChange={onChange}
                        placeholder="Ej: Akapoolco Billar"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Slug (ID Único)</label>
                    <div className="flex items-center">
                        <input
                            name="slug"
                            value={data.slug}
                            onChange={onChange}
                            placeholder="akapoolco"
                            className="flex-1 px-4 py-2 rounded-l-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all lowercase"
                        />
                        <span className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-l-0 border-gray-200 dark:border-gray-600 rounded-r-lg text-sm text-gray-500">
                            .billarpro.cl
                        </span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">País</label>
                    <select
                        name="country"
                        value={data.country}
                        onChange={onChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                        <option value="CL">Chile (CLP)</option>
                        <option value="PE">Perú (PEN)</option>
                        <option value="MX">México (MXN)</option>
                        <option value="ES">España (EUR)</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

function Step2Business({ data, onSelect }: { data: any, onSelect: (val: string) => void }) {
    return (
        <div className="space-y-6">
            <header>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Modelo de Negocio</h3>
                <p className="text-sm text-gray-500">¿Cómo interactúan tus clientes con el sistema?</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => onSelect('CLUB')}
                    className={cn(
                        "p-6 rounded-xl border-2 text-left transition-all group",
                        data.type === 'CLUB' ? "border-indigo-600 bg-indigo-50/50" : "border-gray-100 hover:border-indigo-200"
                    )}
                >
                    <div className="mb-4 w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Club de Socios</h4>
                    <p className="text-sm text-gray-500 mt-2">Enfoque en membresías, niveles de socios (VIP, Gold) y beneficios recurrentes.</p>
                </button>

                <button
                    type="button"
                    onClick={() => onSelect('BUSINESS')}
                    className={cn(
                        "p-6 rounded-xl border-2 text-left transition-all group",
                        data.type === 'BUSINESS' ? "border-indigo-600 bg-indigo-50/50" : "border-gray-100 hover:border-indigo-200"
                    )}
                >
                    <div className="mb-4 w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Comercial / Abierto</h4>
                    <p className="text-sm text-gray-500 mt-2">Venta directa al público, POS rápido, sin necesidad de registro de membresía.</p>
                </button>
            </div>
        </div>
    );
}

function Step3Branding({ data, onChange, setFormData }: { data: any, onChange: (e: any) => void, setFormData: React.Dispatch<React.SetStateAction<any>> }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { url } = await uploadLogo(formData);
            setFormData((prev: any) => ({ ...prev, logoUrl: url }));
            toast.success('Logo subido correctamente');
        } catch (error) {
            toast.error('Error al subir el logo');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const contrast = validateThemeContrast({
        primaryColor: data.primaryColor,
        secondaryColor: '#ffffff',
        backgroundColor: data.backgroundColor,
        businessModel: data.type === 'CLUB' ? 'CLUB_SOCIOS' : 'COMERCIAL'
    });

    return (
        <div className="space-y-8">
            <header>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Identidad Visual</h3>
                <p className="text-sm text-gray-500">Personaliza la "piel" de tu plataforma.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Logo del Establecimiento</label>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-medium text-gray-600"
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {data.logoUrl ? 'Cambiar Logo' : 'Subir Imagen'}
                            </button>
                            {data.logoUrl && (
                                <button
                                    type="button"
                                    onClick={() => setFormData((p: any) => ({ ...p, logoUrl: '' }))}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    Eliminar
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400">Recomendado: PNG o SVG transparente, máx 2MB.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="primaryColor" className="text-sm font-semibold text-gray-700">Color Primario</label>
                            <input
                                id="primaryColor"
                                type="color"
                                name="primaryColor"
                                value={data.primaryColor}
                                onChange={onChange}
                                className="w-full h-12 p-1 rounded-lg cursor-pointer border-none"
                                title="Color Primario"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="backgroundColor" className="text-sm font-semibold text-gray-700">Color Fondo</label>
                            <input
                                id="backgroundColor"
                                type="color"
                                name="backgroundColor"
                                value={data.backgroundColor}
                                onChange={onChange}
                                className="w-full h-12 p-1 rounded-lg cursor-pointer border-none"
                                title="Color de Fondo"
                            />
                        </div>
                    </div>

                    <div className={cn(
                        "p-4 rounded-lg flex items-start gap-3",
                        contrast.isValid ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                    )}>
                        {contrast.isValid ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <div>
                            <p className="text-sm font-bold">Sentinel: Audición de Contraste</p>
                            <p className="text-xs mt-1">{contrast.isValid ? 'Cumple con estándares de accesibilidad WCAG AA.' : contrast.finding}</p>
                        </div>
                    </div>
                </div>

                {/* Real-time Preview */}
                <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700">Vista Previa</label>
                    <div
                        className="aspect-video rounded-xl border border-gray-200 shadow-inner flex flex-col items-center justify-center p-6 gap-4"
                        style={{ backgroundColor: data.backgroundColor }}
                    >
                        {data.logoUrl ? (
                            <img src={data.logoUrl} alt="Logo" className="h-12 object-contain" />
                        ) : (
                            <Building2 className="w-12 h-12 opacity-20" />
                        )}
                        <button
                            className="px-6 py-2 rounded-full text-white font-bold shadow-lg"
                            style={{ backgroundColor: data.primaryColor }}
                        >
                            Acción Principal
                        </button>
                        <div className="flex gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.primaryColor }} />
                            <div className="w-20 h-2 rounded bg-gray-200" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Step4Access({ data, onChange, onSelectPlan }: { data: any, onChange: (e: any) => void, onSelectPlan: (val: string) => void }) {
    return (
        <div className="space-y-8">
            <header>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Acceso y Plan</h3>
                <p className="text-sm text-gray-500">Configura el administrador maestro y elige la potencia del servicio.</p>
            </header>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nombre del Owner</label>
                        <input
                            name="adminName"
                            value={data.adminName}
                            onChange={onChange}
                            placeholder="Rodrigo K."
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email Administrativo</label>
                        <input
                            name="adminEmail"
                            value={data.adminEmail}
                            onChange={onChange}
                            placeholder="admin@club.cl"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Contraseña Temporal</label>
                    <input
                        type="password"
                        name="adminPassword"
                        value={data.adminPassword}
                        onChange={onChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['BASIC', 'PRO', 'ENTERPRISE'].map((plan) => (
                        <button
                            key={plan}
                            type="button"
                            onClick={() => onSelectPlan(plan)}
                            className={cn(
                                "p-4 rounded-xl border-2 text-center transition-all",
                                data.plan === plan ? "border-indigo-600 bg-indigo-50" : "border-gray-100"
                            )}
                        >
                            <span className="text-xs font-bold text-indigo-600">{plan}</span>
                            <div className="text-lg font-bold mt-1">
                                {plan === 'BASIC' ? '$29' : plan === 'PRO' ? '$59' : '$199'}/mes
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
