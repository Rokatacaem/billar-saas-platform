/**
 * 🛡️ SENTINEL: Split Bill Consistency Validator
 * 
 * Ensures that split transactions match the original total EXACTLY
 * No money should be lost or created during splits
 */

import { SplitPart } from '@/components/comercial/SplitBillModal';

export interface SplitValidationResult {
    valid: boolean;
    originalTotal: number;
    splitTotal: number;
    difference: number;
    tolerance: number;
    violations: string[];
}

/**
 * Validate that split parts sum to original total
 * Uses 1 cent tolerance for floating point precision
 */
export function validateSplitConsistency(
    originalAmount: number,
    splits: SplitPart[]
): SplitValidationResult {
    const tolerance = 0.01; // 1 cent
    const violations: string[] = [];

    // Calculate split total
    const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);

    // Calculate difference
    const difference = Math.abs(originalAmount - splitTotal);

    // Check if within tolerance
    const valid = difference < tolerance;

    // Document violations
    if (!valid) {
        violations.push(
            `Total mismatch: Original ${originalAmount.toFixed(2)} vs Split ${splitTotal.toFixed(2)}`
        );
    }

    // Check for negative amounts
    const negativeAmounts = splits.filter(s => s.amount < 0);
    if (negativeAmounts.length > 0) {
        violations.push(
            `Negative amounts detected: Parts ${negativeAmounts.map(s => s.partNumber).join(', ')}`
        );
    }

    // Check for zero amounts
    const zeroAmounts = splits.filter(s => s.amount === 0);
    if (zeroAmounts.length > 0) {
        violations.push(
            `Zero amounts detected: Parts ${zeroAmounts.map(s => s.partNumber).join(', ')}`
        );
    }

    return {
        valid: valid && violations.length === 0,
        originalTotal: originalAmount,
        splitTotal,
        difference,
        tolerance,
        violations
    };
}

// Logging logic moved to src/app/actions/audit-actions.ts to prevent bundling issues

/**
 * Generate individual receipts for each split part
 */
export async function generateSplitReceipts(
    sessionId: string,
    tableNumber: number,
    splits: SplitPart[],
    tenantId: string
): Promise<string[]> {
    const receiptUrls: string[] = [];

    // This would integrate with your PDF generation system
    // For now, return placeholder URLs
    for (const split of splits) {
        const url = `/api/receipts/split/${sessionId}_part_${split.partNumber}.pdf`;
        receiptUrls.push(url);

        // Log each receipt generation
        console.log(`[Sentinel] Generated split receipt: ${url} for $${split.amount}`);
    }

    return receiptUrls;
}

/**
 * Test split validation with known scenarios
 */
export function testSplitValidation() {
    console.log('=== SENTINEL: Split Bill Validation Tests ===\n');

    // Test 1: Perfect split
    const test1 = validateSplitConsistency(10000, [
        { partNumber: 1, amount: 5000, description: 'Person 1' },
        { partNumber: 2, amount: 5000, description: 'Person 2' }
    ]);
    console.log('Test 1 (Perfect Split):', test1.valid ? '✅ PASS' : '❌ FAIL');
    console.log(`  Original: $${test1.originalTotal} | Split: $${test1.splitTotal} | Diff: $${test1.difference}\n`);

    // Test 2: Imperfect split (within tolerance)
    const test2 = validateSplitConsistency(10000, [
        { partNumber: 1, amount: 5000.005, description: 'Person 1' },
        { partNumber: 2, amount: 4999.995, description: 'Person 2' }
    ]);
    console.log('Test 2 (Within Tolerance):', test2.valid ? '✅ PASS' : '❌ FAIL');
    console.log(`  Original: $${test2.originalTotal} | Split: $${test2.splitTotal} | Diff: $${test2.difference}\n`);

    // Test 3: Invalid split (exceeds tolerance)
    const test3 = validateSplitConsistency(10000, [
        { partNumber: 1, amount: 5000, description: 'Person 1' },
        { partNumber: 2, amount: 5100, description: 'Person 2' }
    ]);
    console.log('Test 3 (Exceeds Tolerance):', test3.valid ? '✅ PASS' : '❌ FAIL');
    console.log(`  Original: $${test3.originalTotal} | Split: $${test3.splitTotal} | Diff: $${test3.difference}`);
    console.log(`  Violations: ${test3.violations.join(', ')}\n`);

    // Test 4: Negative amounts
    const test4 = validateSplitConsistency(10000, [
        { partNumber: 1, amount: 12000, description: 'Person 1' },
        { partNumber: 2, amount: -2000, description: 'Person 2' }
    ]);
    console.log('Test 4 (Negative Amount):', test4.valid ? '✅ PASS' : '❌ FAIL');
    console.log(`  Violations: ${test4.violations.join(', ')}\n`);

    const allPassed = [test1, test2].every(t => t.valid) &&
        ![test3, test4].some(t => t.valid);

    console.log(allPassed ? '🎉 All tests PASSED!' : '⚠️  Some tests FAILED');

    return allPassed;
}
