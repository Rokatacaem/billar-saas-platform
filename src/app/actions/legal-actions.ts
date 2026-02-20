'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { validateRut, cleanRut } from '@/lib/chile/rut-validator';

export async function updateLegalConfig(
    rutEmisor: string,
    razonSocial: string,
    giro: string,
    direccionTributaria: string
) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
        return { success: false, error: 'No autorizado' };
    }

    // Validación Módulo 11 Sentinel
    if (!validateRut(rutEmisor)) {
        return { success: false, error: 'RUT Emisor inválido. Usa formato 12345678-9.' };
    }

    try {
        await prisma.tenant.update({
            where: { id: session.user.tenantId },
            data: {
                rutEmisor: cleanRut(rutEmisor), // DB almacena 123456789
                razonSocial: razonSocial.trim(),
                giro: giro.trim(),
                direccionTributaria: direccionTributaria.trim()
            }
        });

        // Audit Log
        await prisma.systemLog.create({
            data: {
                level: 'INFO',
                tenantId: session.user.tenantId,
                message: `⚖️ Legal Config Updated: Datos de facturación configurados para RUT ${rutEmisor}.`,
            }
        });

        return { success: true };
    } catch (e) {
        console.error("Error updating legal config:", e);
        return { success: false, error: 'Error interno guardando configuración legal.' };
    }
}
