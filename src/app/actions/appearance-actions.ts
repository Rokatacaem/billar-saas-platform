'use server';

import { prisma } from '@/lib/prisma';
import { THEME_PRESETS } from '@/lib/theming/theme-presets';
import { revalidatePath } from 'next/cache';

export async function updateTenantAppearance(tenantId: string, presetId: string) {
    try {
        const preset = THEME_PRESETS[presetId];
        if (!preset) {
            return { success: false, error: 'Preset desconocido.' };
        }

        // Actualiza el Tenant con el preset seleccionado
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                primaryColor: preset.uiConfig.primaryColor,
                secondaryColor: preset.uiConfig.secondaryColor,
                // backgroundColor y legacy colors inside settings/root can be mapped here:
                settings: {
                    backgroundColor: preset.uiConfig.backgroundColor,
                },
                uiConfig: preset.uiConfig
            }
        });

        revalidatePath('/tenant/[slug]/admin/settings/appearance', 'page');
        revalidatePath('/tenant/[slug]', 'layout'); // Fuerza a recargar ThemeProvider

        return { success: true };
    } catch (error) {
        console.error("Error al actualizar apariencia:", error);
        return { success: false, error: 'Falló la actualización del Tema.' };
    }
}
