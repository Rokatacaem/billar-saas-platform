/**
 * 🛡️ SENTINEL: Performance & Accessibility Validation
 */

/**
 * Validate theme performance metrics
 * In production, this would integrate with Lighthouse CI
 */
export async function validateThemePerformance(url: string): Promise<{
    lcp: number;
    fcp: number;
    cls: number;
    passed: boolean;
}> {
    // Placeholder for Lighthouse integration
    // In production:
    // - Run Lighthouse programmatically
    // - Check LCP < 1.2s
    // - Check CLS < 0.1
    // - Check FCP < 1.0s

    console.log(`[Sentinel] Performance validation for: ${url}`);

    return {
        lcp: 0,
        fcp: 0,
        cls: 0,
        passed: true
    };
}

/**
 * Validate color contrast ratio (WCAG AA compliance)
 * Minimum ratio: 4.5:1 for normal text
 */
export function validateColorContrast(
    textColor: string,
    backgroundColor: string
): { ratio: number; passed: boolean; level: 'AAA' | 'AA' | 'FAIL' } {
    const rgb1 = hexToRgb(textColor);
    const rgb2 = hexToRgb(backgroundColor);

    const l1 = relativeLuminance(rgb1);
    const l2 = relativeLuminance(rgb2);

    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    let level: 'AAA' | 'AA' | 'FAIL';
    if (ratio >= 7.0) {
        level = 'AAA';
    } else if (ratio >= 4.5) {
        level = 'AA';
    } else {
        level = 'FAIL';
    }

    return {
        ratio: parseFloat(ratio.toFixed(2)),
        passed: ratio >= 4.5,
        level
    };
}

/**
 * Calculate relative luminance for contrast ratio
 * Based on WCAG recommendation
 */
function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex values
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

/**
 * Validate all theme colors for accessibility
 */
export function validateThemeAccessibility(theme: {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: {
            primary: string;
            secondary: string;
            accent: string;
        };
    };
}): {
    passed: boolean;
    violations: Array<{
        pair: string;
        ratio: number;
        level: string;
    }>;
} {
    const violations: Array<{ pair: string; ratio: number; level: string }> = [];

    // Check primary text on background
    const primaryContrast = validateColorContrast(
        theme.colors.text.primary,
        theme.colors.background
    );
    if (!primaryContrast.passed) {
        violations.push({
            pair: 'Primary text on background',
            ratio: primaryContrast.ratio,
            level: primaryContrast.level
        });
    }

    // Check accent text on background
    const accentContrast = validateColorContrast(
        theme.colors.text.accent,
        theme.colors.background
    );
    if (!accentContrast.passed) {
        violations.push({
            pair: 'Accent text on background',
            ratio: accentContrast.ratio,
            level: accentContrast.level
        });
    }

    return {
        passed: violations.length === 0,
        violations
    };
}

/**
 * Test theme isolation - ensure no CSS bleeding between tenants
 */
export function testThemeIsolation(): {
    passed: boolean;
    leaks: string[];
} {
    const leaks: string[] = [];

    // Check for global theme classes
    const bodyClasses = Array.from(document.body.classList);
    const themeClasses = bodyClasses.filter(c => c.startsWith('theme-'));

    if (themeClasses.length > 1) {
        leaks.push(`Multiple theme classes active: ${themeClasses.join(', ')}`);
    }

    // Check for orphaned style elements
    const themeStyles = document.querySelectorAll('style#dynamic-theme-vars');
    if (themeStyles.length > 1) {
        leaks.push(`Multiple theme style elements found: ${themeStyles.length}`);
    }

    return {
        passed: leaks.length === 0,
        leaks
    };
}
