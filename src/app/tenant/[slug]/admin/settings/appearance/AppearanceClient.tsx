'use client';

import { useState, useTransition } from 'react';
import { THEME_PRESETS, getAvailablePresets } from '@/lib/theming/theme-presets';
import { updateTenantAppearance } from '@/app/actions/appearance-actions';
import { useRouter } from 'next/navigation';

export default function AppearanceClient({ tenantId, currentThemeId }: { tenantId: string, currentThemeId: string }) {
    const router = useRouter();
    const presets = getAvailablePresets();
    const [selected, setSelected] = useState(currentThemeId);
    const [isPending, startTransition] = useTransition();

    const handleApply = (presetId: string) => {
        setSelected(presetId);
        startTransition(async () => {
            const res = await updateTenantAppearance(tenantId, presetId);
            if (res.success) {
                // Trigger a hard reload smoothly or wait for layout transition.
                window.location.reload();
            } else {
                alert("Error aplicando tema: " + res.error);
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.map((preset) => {
                const isActive = selected === preset.id;

                return (
                    <div
                        key={preset.id}
                        className={`flex flex-col rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${isActive ? 'border-indigo-600 shadow-xl scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                        onClick={() => setSelected(preset.id)}
                    >
                        {/* Mini-Preview Container */}
                        <div
                            className="h-32 w-full flex items-center justify-center relative"
                            style={{ backgroundColor: preset.uiConfig.backgroundColor }}
                        >
                            {/* Texture Overlay Preview */}
                            {preset.uiConfig.texture === 'cloth' && (
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/woven-light.png')]" />
                            )}
                            {preset.uiConfig.texture === 'marble' && (
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/white-marble.png')]" />
                            )}

                            {/* UI Simulation */}
                            <div className="w-3/4 bg-white/10 backdrop-blur-sm border shadow-lg flex flex-col gap-2 p-3"
                                style={{
                                    borderRadius: preset.uiConfig.radius,
                                    borderColor: preset.uiConfig.secondaryColor
                                }}>
                                <div className="h-4 w-1/2 rounded" style={{ backgroundColor: preset.uiConfig.primaryColor }} />
                                <div className="flex gap-2">
                                    <div className="h-6 w-full rounded" style={{ backgroundColor: preset.uiConfig.primaryColor, borderRadius: preset.uiConfig.radius }} />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="p-5 bg-white flex flex-col flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{preset.name}</h3>
                            <p className="text-sm text-gray-500 flex-1">{preset.description}</p>

                            <div className="mt-4 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <span className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: preset.uiConfig.primaryColor }} />
                                    <span className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: preset.uiConfig.secondaryColor }} />
                                    <span className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: preset.uiConfig.backgroundColor }} />
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleApply(preset.id); }}
                                    disabled={isPending}
                                    className={`w-full mt-2 py-2 rounded-lg font-bold transition-colors ${isActive
                                            ? 'bg-indigo-600 text-white cursor-default'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {isPending && selected === preset.id ? 'Aplicando...' : isActive ? 'Activo' : 'Aplicar Tema'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
