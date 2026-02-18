'use server';

import { prisma } from "@/lib/prisma";
import { calculateTotal } from "@/lib/pricing/PricingEngine";
import { logSecurityEvent, ThreatLevel } from "@/lib/security/intrusion-detector";
import { validateDiscountIntegrity } from "@/lib/pricing/PricingEngine";

/**
 * 🧮 PROCESS PAYMENT: Calculate total with PricingEngine
 * Integrates business-aware logic and Sentinel validation
 */
export async function processPayment(usageLogId: string, userId: string) {
    try {
        // 1. Fetch full context
        const usageLog = await prisma.usageLog.findUnique({
            where: { id: usageLogId },
            include: {
                tenant: true,
                member: true,
                table: true,
                items: { include: { product: true } }
            }
        });

        if (!usageLog) {
            return { success: false, error: 'Session not found' };
        }

        if (!usageLog.endedAt) {
            return { success: false, error: 'Session not closed yet' };
        }

        // 2. Calculate consumption total
        const consumptionTotal = usageLog.items.reduce((sum, item) => sum + item.totalPrice, 0);

        // 3. Use PricingEngine to calculate total
        const pricingResult = calculateTotal({
            tenant: {
                businessModel: usageLog.tenant.businessModel,
                tierSettings: usageLog.tenant.tierSettings,
                baseRate: usageLog.tenant.baseRate,
                taxRate: usageLog.tenant.taxRate,
                taxName: usageLog.tenant.taxName,
                currencyCode: usageLog.tenant.currencyCode,
                currencySymbol: usageLog.tenant.currencySymbol
            },
            member: usageLog.member ? {
                category: usageLog.member.category,
                membershipStatus: usageLog.member.membershipStatus,
                discount: usageLog.member.discount
            } : undefined,
            durationMinutes: usageLog.durationMinutes || 0,
            consumptionTotal
        });

        // 4. 🛡️ SENTINEL: Log warnings if any
        if (pricingResult.warnings && pricingResult.warnings.length > 0) {
            await logSecurityEvent({
                type: 'MEMBERSHIP_STATUS_WARNING',
                severity: ThreatLevel.LOW,
                message: pricingResult.warnings.join('; '),
                details: {
                    usageLogId,
                    tenantId: usageLog.tenantId,
                    memberId: usageLog.memberId,
                    memberCategory: usageLog.member?.category,
                    membershipStatus: usageLog.member?.membershipStatus
                }
            });
        }

        // 5. 🛡️ SENTINEL: Validate if discount was already applied manually
        if (usageLog.discountApplied > 0) {
            const validation = validateDiscountIntegrity(usageLog.discountApplied, pricingResult);

            if (!validation.valid) {
                await logSecurityEvent({
                    type: 'CRITICAL_PRICE_MISMATCH',
                    severity: ThreatLevel.CRITICAL,
                    message: `Discount integrity violation: ${validation.reason}`,
                    details: {
                        usageLogId,
                        tenantId: usageLog.tenantId,
                        appliedDiscount: usageLog.discountApplied,
                        expectedDiscount: pricingResult.discountAmount,
                        userId
                    }
                });
            }
        }

        // 6. Update UsageLog with calculated values
        await prisma.usageLog.update({
            where: { id: usageLogId },
            data: {
                amountCharged: pricingResult.total,
                discountApplied: pricingResult.discountAmount
            }
        });

        return {
            success: true,
            pricing: pricingResult
        };

    } catch (error) {
        console.error('[processPayment] Error:', error);
        return { success: false, error: 'Database error' };
    }
}
