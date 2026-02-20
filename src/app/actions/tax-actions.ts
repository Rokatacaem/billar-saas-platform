'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export interface TaxConfig {
    rate: number;       // 0.0 – 1.0 (e.g. 0.19)
    name: string;       // 'IVA', 'IGV', etc.
    exempt: boolean;    // true si el tenant es exento
    percentage: number; // 0 – 100 para mostrar en UI
}

/**
 * 🛡️ SENTINEL: Obtiene y valida la configuración de impuesto del tenant.
 *
 * Reglas de negocio:
 * - taxRate debe estar entre 0.0 y 1.0
 * - Si taxRate === 0 y el tenant NO es exento, se emite WARN en SystemLog
 * - Si taxRate > 1.0 o < 0, se rechaza y se usa 0.0 (valor seguro)
 */
export async function getTaxConfig(tenantId: string): Promise<TaxConfig> {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { taxRate: true, taxName: true, isTaxExempt: true },
    });

    if (!tenant) {
        return { rate: 0, name: 'Tax', exempt: false, percentage: 0 };
    }

    let rate = tenant.taxRate ?? 0;
    const exempt = tenant.isTaxExempt ?? false;
    const name = tenant.taxName ?? 'IVA';

    // ── Validación de rango ──────────────────────────────────────────────────
    if (rate < 0 || rate > 1) {
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                tenantId,
                message: `🚨 Sentinel Tax Audit: taxRate inválido (${rate}). Debe estar entre 0.0 y 1.0. Se usará 0.`,
            },
        });
        rate = 0;
    }

    // ── Alerta por 0% no exento ──────────────────────────────────────────────
    if (rate === 0 && !exempt) {
        await prisma.systemLog.create({
            data: {
                level: 'WARN',
                tenantId,
                message: `⚠️ Sentinel Tax Audit: El tenant está facturando con 0% pero NO está marcado como exento. Verifica si corresponde a Boleta Exenta o configura isTaxExempt = true.`,
            },
        });
    }

    return {
        rate,
        name,
        exempt,
        percentage: Math.round(rate * 100),
    };
}

/**
 * Extrae el desglose de IVA desde un precio BRUTO (precio al público).
 *
 * Los valores de baseRate y precios de productos se ingresan como
 * precios al público (IVA incluido). Este helper desglosa el componente
 * de IVA para reportes contables y para el SII.
 *
 * Ejemplo con IVA 19%:
 *   grossAmount = $7.140 (precio al público)
 *   netAmount   = $6.000 (neto contable)
 *   taxAmount   = $1.140 (IVA a declarar)
 *
 * @param grossAmount - Precio al público (IVA incluido) — lo que paga el cliente
 * @param taxRate     - Tasa decimal (e.g. 0.19 = 19%)
 */
export function calculateTaxBreakdown(grossAmount: number, taxRate: number): {
    netAmount: number;    // Neto contable (para Z-Report y SII)
    taxAmount: number;    // IVA a declarar
    grossAmount: number;  // Precio al público (amountCharged)
} {
    if (taxRate <= 0) {
        return { netAmount: grossAmount, taxAmount: 0, grossAmount };
    }
    const netAmount = grossAmount / (1 + taxRate);
    const taxAmount = grossAmount - netAmount;
    return {
        netAmount: parseFloat(netAmount.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        grossAmount: parseFloat(grossAmount.toFixed(2)),
    };
}

/**
 * Actualiza la configuración fiscal del tenant autenticado.
 * Usa auth() internamente para garantizar aislamiento multi-tenant.
 * Valida el rango antes de guardar (OWASP Input Validation).
 *
 * @param taxPercentage - Porcentaje de impuesto (0–100)
 * @param taxName       - Nombre del impuesto (IVA, IGV, etc.)
 * @param isTaxExempt   - true si el tenant está exento
 */
export async function updateTaxConfig(
    taxPercentage: number,
    taxName: string,
    isTaxExempt: boolean
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
        return { success: false, error: 'No autorizado' };
    }
    const tenantId = session.user.tenantId;

    if (taxPercentage < 0 || taxPercentage > 100) {
        return { success: false, error: 'El porcentaje debe estar entre 0 y 100.' };
    }
    if (!taxName.trim()) {
        return { success: false, error: 'El nombre del impuesto es obligatorio.' };
    }

    const taxRate = parseFloat((taxPercentage / 100).toFixed(4));

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { taxRate, taxName: taxName.trim().toUpperCase(), isTaxExempt },
    });

    await prisma.systemLog.create({
        data: {
            level: 'INFO',
            tenantId,
            message: `🔧 Tax Config Updated: ${taxPercentage}% ${taxName.trim().toUpperCase()} (exento: ${isTaxExempt})`,
        },
    });

    return { success: true };
}
