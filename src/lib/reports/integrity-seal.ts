import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

export interface IntegritySeal {
    hash: string;
    timestamp: string;
    algorithm: 'SHA-256';
}

/**
 * 🔐 SENTINEL: Genera un Hash SHA-256 del balance y lo registra como
 * evidencia forense en SystemLog. Si alguien altera los datos, el hash
 * calculado en runtime no coincidirá con el registrado aquí.
 */
export function generateIntegritySeal(data: {
    balanceId: string;
    totalRevenue: number;
    netProfit: number;
    closedBy: string;
    cashInHand: number | null;
    cashDifference: number | null;
    date: Date | string;
}): IntegritySeal {
    const payload = JSON.stringify({
        id: data.balanceId,
        rev: data.totalRevenue,
        net: data.netProfit,
        by: data.closedBy,
        cash: data.cashInHand,
        diff: data.cashDifference,
        ts: data.date,
    });

    const hash = createHash('sha256').update(payload).digest('hex');
    const timestamp = new Date().toISOString();

    return {
        hash,
        timestamp,
        algorithm: 'SHA-256',
    };
}

/**
 * Registra el sello de integridad en SystemLog (inmutable por diseño)
 * y devuelve el sello para incluirlo en el PDF/Email.
 */
export async function saveIntegritySeal(
    tenantId: string,
    balanceId: string,
    seal: IntegritySeal
): Promise<void> {
    await prisma.systemLog.create({
        data: {
            level: 'INFO',
            tenantId,
            message: `🔐 Z-Report Integrity Seal — Balance ${balanceId}`,
            details: {
                balanceId,
                hash: seal.hash,
                algorithm: seal.algorithm,
                sealedAt: seal.timestamp,
            },
        },
    });
}
