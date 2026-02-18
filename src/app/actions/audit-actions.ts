'use server';

import { SplitValidationResult } from "@/lib/sentinel/split-validator";
import { SplitPart } from "@/components/comercial/SplitBillModal";
import { logSecurityEvent, ThreatLevel } from "@/lib/security/intrusion-detector";

export async function logSplitTransactionAction(
    tenantId: string,
    tableId: string,
    originalAmount: number,
    splits: SplitPart[],
    validation: SplitValidationResult
) {
    try {
        await logSecurityEvent({
            type: 'SPLIT_BILL_TRANSACTION',
            severity: validation.valid ? ThreatLevel.LOW : ThreatLevel.MEDIUM,
            message: validation.valid
                ? 'Split bill transaction valid'
                : 'Split bill transaction WARNING - Consistency Check Failed',
            details: {
                tableId,
                originalAmount,
                splitCount: splits.length,
                splitTotal: validation.splitTotal,
                difference: validation.difference,
                valid: validation.valid,
                violations: validation.violations,
                splits: splits.map(s => ({
                    part: s.partNumber,
                    amount: s.amount,
                    description: s.description
                }))
            },
            tenantId
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log split transaction:", error);
        return { success: false, error: "Failed to log audit event" };
    }
}
