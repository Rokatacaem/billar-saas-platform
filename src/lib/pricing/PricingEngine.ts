/**
 * 🏛️ PRICING ENGINE MULTIMODELO
 * Motor de cobro dinámico consciente del businessModel y MemberCategory
 * 
 * Soporta:
 * - CLUB_SOCIOS: Descuento solo con membership ACTIVE
 * - COMERCIAL: Descuentos VIP/SOCIO sin cuota mensual
 * - Integración global de impuestos (IVA/IGV)
 * - Redondeo según currencyCode (CLP sin decimales, USD con decimales)
 */

import { BusinessModel, MemberCategory, Tenant, Member } from "@prisma/client";

export interface PricingInput {
    tenant: {
        businessModel: BusinessModel;
        tierSettings: any; // JSON
        baseRate: number;
        taxRate: number;
        taxName: string;
        currencyCode: string;
        currencySymbol: string;
    };
    member?: {
        category: MemberCategory;
        subscriptionStatus?: string | null;
        discount: number;
    };
    durationMinutes: number;
    consumptionTotal: number; // Total de items del bar
}

export interface PricingResult {
    subtotal: number;          // Total antes de impuestos
    discountAmount: number;    // Monto del descuento aplicado
    discountPercentage: number; // % del descuento
    taxAmount: number;         // Monto del impuesto
    total: number;             // Total final

    // Metadata
    appliedDiscount: boolean;
    discountReason?: string;
    memberCategory?: MemberCategory;
    businessModel: BusinessModel;

    // Warnings
    warnings?: string[];
}

/**
 * 🎯 CORE: Calculate total with business-aware logic
 */
export function calculateTotal(input: PricingInput): PricingResult {
    const { tenant, member, durationMinutes, consumptionTotal } = input;

    // 1. Calcular tiempo base
    const timeCharge = (durationMinutes / 60) * tenant.baseRate;

    // 2. Determinar descuento según businessModel
    let discountPercentage = 0;
    let discountReason = '';
    let warnings: string[] = [];

    if (member) {
        if (tenant.businessModel === 'CLUB_SOCIOS') {
            // 🏛️ MODELO CLUB: Descuento solo si membership ACTIVE
            if (member.category === 'SOCIO') {
                if (member.subscriptionStatus === 'ACTIVE') {
                    discountPercentage = member.discount;
                    discountReason = 'SOCIO membership active';
                } else {
                    warnings.push(`⚠️ SOCIO membership NOT ACTIVE (status: ${member.subscriptionStatus || 'undefined'}). Applying GENERAL rate.`);
                    discountPercentage = 0;
                    discountReason = 'SOCIO membership expired';
                }
            }
            // En modelo CLUB, VIP y GENERAL no tienen descuento

        } else if (tenant.businessModel === 'COMERCIAL') {
            // 💼 MODELO COMERCIAL: VIP y SOCIO tienen descuento
            if (member.category === 'VIP') {
                // @ts-ignore - tierSettings es Json
                discountPercentage = tenant.tierSettings?.vipDiscount || member.discount;
                discountReason = 'VIP customer discount';
            } else if (member.category === 'SOCIO') {
                // @ts-ignore
                discountPercentage = tenant.tierSettings?.socioDiscount || member.discount;
                discountReason = 'SOCIO customer discount';
            }
            // GENERAL no tiene descuento
        }
    }

    // 3. Aplicar descuento solo al tiempo (consumo no tiene descuento)
    const discountedTime = timeCharge * (1 - discountPercentage / 100);
    const discountAmount = timeCharge - discountedTime;

    // 4. Subtotal (tiempo con descuento + consumo)
    const subtotal = discountedTime + consumptionTotal;

    // 5. Aplicar impuestos
    const taxAmount = subtotal * tenant.taxRate;

    // 6. Total final
    let total = subtotal + taxAmount;

    // 7. Redondeo según currencyCode
    total = roundByCurrency(total, tenant.currencyCode);

    return {
        subtotal: roundByCurrency(subtotal, tenant.currencyCode),
        discountAmount: roundByCurrency(discountAmount, tenant.currencyCode),
        discountPercentage,
        taxAmount: roundByCurrency(taxAmount, tenant.currencyCode),
        total,
        appliedDiscount: discountPercentage > 0,
        discountReason: discountReason || undefined,
        memberCategory: member?.category,
        businessModel: tenant.businessModel,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * 🌍 Redondeo según moneda
 * CLP: sin decimales (redondear a entero)
 * USD, EUR, MXN: 2 decimales
 */
function roundByCurrency(amount: number, currencyCode: string): number {
    const noDecimalCurrencies = ['CLP', 'JPY', 'KRW']; // Monedas sin decimales

    if (noDecimalCurrencies.includes(currencyCode)) {
        return Math.round(amount);
    }

    return Math.round(amount * 100) / 100; // 2 decimales
}

/**
 * 🛡️ SENTINEL: Validate discount integrity
 * Verifica que el descuento aplicado coincida con las reglas del tenant
 */
export function validateDiscountIntegrity(
    appliedDiscount: number,
    expectedResult: PricingResult
): {
    valid: boolean;
    reason?: string;
} {
    const tolerance = 0.01; // Tolerancia de 1 centavo por redondeo

    if (Math.abs(appliedDiscount - expectedResult.discountAmount) > tolerance) {
        return {
            valid: false,
            reason: `Discount mismatch: Applied ${appliedDiscount} vs Expected ${expectedResult.discountAmount}`
        };
    }

    return { valid: true };
}

/**
 * 🎨 Get tier badge config for UI
 */
export function getTierBadge(category: MemberCategory): {
    label: string;
    color: string;
    icon: string;
} {
    switch (category) {
        case 'SOCIO':
            return {
                label: 'SOCIO',
                color: 'bg-blue-500 text-white',
                icon: '⭐'
            };
        case 'VIP':
            return {
                label: 'VIP',
                color: 'bg-yellow-500 text-black',
                icon: '💎'
            };
        case 'GENERAL':
        default:
            return {
                label: 'GENERAL',
                color: 'bg-gray-400 text-white',
                icon: '👤'
            };
    }
}

/**
 * 📊 Format price according to tenant locale
 */
export function formatPrice(
    amount: number,
    tenant: {
        currencyCode: string;
        currencySymbol: string;
        locale: string;
    }
): string {
    const formatted = new Intl.NumberFormat(tenant.locale, {
        minimumFractionDigits: tenant.currencyCode === 'CLP' ? 0 : 2,
        maximumFractionDigits: tenant.currencyCode === 'CLP' ? 0 : 2
    }).format(amount);

    return `${tenant.currencySymbol}${formatted}`;
}
