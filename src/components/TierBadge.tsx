'use client';

import { MemberCategory } from "@prisma/client";

interface TierBadgeProps {
    category: MemberCategory;
    showIcon?: boolean;
    className?: string;
}

/**
 * 🎨 Tier Badge Component
 * Visual indicator of member category with color coding
 */
export default function TierBadge({ category, showIcon = true, className = '' }: TierBadgeProps) {
    const badges = {
        SOCIO: {
            label: 'SOCIO',
            icon: '⭐',
            className: 'bg-blue-500 text-white'
        },
        VIP: {
            label: 'VIP',
            icon: '💎',
            className: 'bg-yellow-500 text-black'
        },
        GENERAL: {
            label: 'GENERAL',
            icon: '👤',
            className: 'bg-gray-400 text-white'
        }
    };

    const badge = badges[category];

    return (
        <span className={`px-2 py-1 text-xs font-bold rounded inline-flex items-center gap-1 ${badge.className} ${className}`}>
            {showIcon && badge.icon}{' '}{badge.label}
        </span>
    );
}

/**
 * 🎨 Membership Status Warning Component
 * Displays alert when SOCIO membership is not ACTIVE
 */
export function MembershipStatusWarning({
    category, // Keep category as it's used in the logic
    subscriptionStatus
}: {
    category: 'GENERAL' | 'VIP' | 'SOCIO'; // Update category type as per instruction
    subscriptionStatus?: string | null;
}) {
    if (category !== 'SOCIO' || subscriptionStatus === 'ACTIVE') {
        return null;
    }

    return (
        <div className="p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800 flex items-start gap-2">
            <span>⚠️</span>
            <div>
                <strong>Membresía NO ACTIVA</strong>
                <br />
                Status: {subscriptionStatus || 'undefined'}. Se aplicará tarifa GENERAL.
            </div>
        </div>
    );
}
