'use server';

import { prisma } from "@/lib/prisma";
import { logSecurityEvent, ThreatLevel } from "@/lib/security/intrusion-detector";

/**
 * 🛡️ SENTINEL: Upgrade member tier with audit trail
 */
export async function upgradeMemberTier(
    memberId: string,
    newCategory: 'GENERAL' | 'VIP' | 'SOCIO',
    reason: string,
    userId: string
) {
    try {
        // Obtener member actual
        const member = await prisma.member.findUnique({
            where: { id: memberId }
        });

        if (!member) {
            return { success: false, error: 'Member not found' };
        }

        // 🛡️ SECURITY: No permitir downgrade de SOCIO a GENERAL sin razón validada
        if (member.category === 'SOCIO' && newCategory === 'GENERAL' && !reason.includes('vencimiento')) {
            await logSecurityEvent({
                type: 'SUSPICIOUS_TIER_DOWNGRADE',
                severity: ThreatLevel.MEDIUM,
                message: `Attempt to downgrade SOCIO to GENERAL without proper reason`,
                details: { memberId, currentCategory: member.category, newCategory, userId }
            });

            return { success: false, error: 'Downgrade requires valid reason containing "vencimiento"' };
        }

        // Crear audit trail INMUTABLE
        await prisma.tierChange.create({
            data: {
                memberId,
                fromCategory: member.category,
                toCategory: newCategory,
                reason,
                changedBy: userId,
                tenantId: member.tenantId
            }
        });

        // Actualizar categoría
        await prisma.member.update({
            where: { id: memberId },
            data: {
                category: newCategory,
                // Si se hace VIP o SOCIO, resetear subscriptionStatus si es necesario
                ...(newCategory === 'SOCIO' && { subscriptionStatus: 'ACTIVE' })
            }
        });

        // Log de seguridad
        await logSecurityEvent({
            type: 'MEMBER_TIER_CHANGED',
            severity: ThreatLevel.LOW,
            message: `Member ${member.name} tier changed from ${member.category} to ${newCategory}`,
            details: { memberId, reason, changedBy: userId, tenantId: member.tenantId }
        });

        return { success: true };

    } catch (error) {
        console.error('[upgradeMemberTier] Error:', error);
        return { success: false, error: 'Database error' };
    }
}

/**
 * Suggest VIP upgrades based on spending threshold
 */
export async function suggestVIPUpgrades(tenantId: string) {
    try {
        // Obtener tenant con tierSettings
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) {
            return { success: false, error: 'Tenant not found', candidates: [] };
        }

        // @ts-ignore - tierSettings es Json
        const vipThreshold = tenant.tierSettings?.vipThreshold || 50000;

        // Buscar clientes GENERAL que superan el threshold
        const candidates = await prisma.member.findMany({
            where: {
                tenantId,
                category: 'GENERAL',
                amountSpent: { gte: vipThreshold }
            },
            orderBy: {
                amountSpent: 'desc'
            }
        });

        return { success: true, candidates };

    } catch (error) {
        console.error('[suggestVIPUpgrades] Error:', error);
        return { success: false, error: 'Database error', candidates: [] };
    }
}

/**
 * Get tier change audit trail for a member
 */
export async function getMemberTierHistory(memberId: string) {
    try {
        const history = await prisma.tierChange.findMany({
            where: { memberId },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, history };

    } catch (error) {
        console.error('[getMemberTierHistory] Error:', error);
        return { success: false, error: 'Database error', history: [] };
    }
}

/**
 * 🛡️ SENTINEL: Detect suspicious tier upgrades (rate limiting)
 * Alert if >5 VIP upgrades in last 24h by same user
 */
export async function auditTierUpgrades(tenantId: string) {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const recentUpgrades = await prisma.tierChange.findMany({
            where: {
                tenantId,
                toCategory: 'VIP',
                createdAt: { gte: yesterday }
            }
        });

        // Agrupar por changedBy
        const byUser: Record<string, number> = {};
        recentUpgrades.forEach(upgrade => {
            byUser[upgrade.changedBy] = (byUser[upgrade.changedBy] || 0) + 1;
        });

        // Detectar usuarios con >5 upgrades
        const suspicious = Object.entries(byUser).filter(([_, count]) => count > 5);

        if (suspicious.length > 0) {
            await logSecurityEvent({
                type: 'EXCESSIVE_TIER_UPGRADES',
                severity: ThreatLevel.HIGH,
                message: `Suspicious tier upgrade activity detected`,
                details: { tenantId, suspicious }
            });
        }

        return { success: true, suspicious };

    } catch (error) {
        console.error('[auditTierUpgrades] Error:', error);
        return { success: false, error: 'Database error', suspicious: [] };
    }
}
