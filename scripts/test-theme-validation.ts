import {
    getThemeForBusinessModel,
    validateColorContrast,
    validateThemeAccessibility,
    HERITAGE_ELITE_THEME,
    NEON_HIGH_VOLTAGE_THEME
} from '../src/lib/theming/theme-engine';
import { validateColorContrast as sentinelValidate } from '../src/lib/sentinel/performance-validator';

/**
 * 🛡️ SENTINEL: Theme Validation Tests
 */

console.log('=== THEME SYSTEM VALIDATION ===\n');

// Test 1: Heritage Elite Theme
console.log('🏛️ Heritage Elite Theme Tests:');
const heritageTheme = HERITAGE_ELITE_THEME;

// Primary text contrast
const heritageContrast = sentinelValidate(
    heritageTheme.colors.text.primary,
    heritageTheme.colors.background
);
console.log(`  ✓ Primary Text Contrast: ${heritageContrast.ratio}:1 (${heritageContrast.level}) - ${heritageContrast.passed ? 'PASS' : 'FAIL'}`);

// Secondary text contrast
const heritageContrast2 = sentinelValidate(
    heritageTheme.colors.text.secondary,
    heritageTheme.colors.background
);
console.log(`  ✓ Secondary Text Contrast: ${heritageContrast2.ratio}:1 (${heritageContrast2.level}) - ${heritageContrast2.passed ? 'PASS' : 'FAIL'}`);

// Accent text contrast
const heritageContrast3 = sentinelValidate(
    heritageTheme.colors.text.accent,
    heritageTheme.colors.background
);
console.log(`  ✓ Accent Text Contrast: ${heritageContrast3.ratio}:1 (${heritageContrast3.level}) - ${heritageContrast3.passed ? 'PASS' : ' FAIL'}`);

console.log('');

// Test 2: Neon High-Voltage Theme
console.log('⚡ Neon High-Voltage Theme Tests:');
const neonTheme = NEON_HIGH_VOLTAGE_THEME;

// Primary text contrast
const neonContrast = sentinelValidate(
    neonTheme.colors.text.primary,
    neonTheme.colors.background
);
console.log(`  ✓ Primary Text Contrast: ${neonContrast.ratio}:1 (${neonContrast.level}) - ${neonContrast.passed ? 'PASS' : 'FAIL'}`);

// Secondary text contrast  
const neonContrast2 = sentinelValidate(
    neonTheme.colors.text.secondary,
    neonTheme.colors.background
);
console.log(`  ✓ Secondary Text Contrast: ${neonContrast2.ratio}:1 (${neonContrast2.level}) - ${neonContrast2.passed ? 'PASS' : 'FAIL'}`);

// Accent text contrast
const neonContrast3 = sentinelValidate(
    neonTheme.colors.text.accent,
    neonTheme.colors.background
);
console.log(`  ✓ Accent Text Contrast: ${neonContrast3.ratio}:1 (${neonContrast3.level}) - ${neonContrast3.passed ? 'PASS' : 'FAIL'}`);

console.log('');

// Test 3: Business Model Mapping
console.log('📊 Business Model Mapping Tests:');

const clubTheme = getThemeForBusinessModel('CLUB_SOCIOS');
console.log(`  ✓ CLUB_SOCIOS → ${clubTheme.name}`);

const comercialTheme = getThemeForBusinessModel('COMERCIAL');
console.log(`  ✓ COMERCIAL → ${comercialTheme.name}`);

console.log('');

// Summary
console.log('=== SUMMARY ===');
const allTests = [
    heritageContrast,
    heritageContrast2,
    heritageContrast3,
    neonContrast,
    neonContrast2,
    neonContrast3
];

const passedTests = allTests.filter(t => t.passed).length;
const failedTests = allTests.filter(t => !t.passed).length;

console.log(`Total Tests: ${allTests.length}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);

if (failedTests === 0) {
    console.log('\n🎉 All accessibility tests PASSED!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some accessibility tests FAILED. Review contrast ratios.');
    process.exit(1);
}
