/**
 * 🎨 Dynamic Theme Generator
 * Translates database colors into CSS variables with accessibility validation.
 */

/**
 * Calculates relative luminance for a hex color
 */
function getLuminance(hex: string): number {
    const rgb = hex.replace(/^#/, '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
    const [r, g, b] = rgb.map(v => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const brighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (brighter + 0.05) / (darker + 0.05);
}

export type TenantThemeSettings = {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    businessModel: 'CLUB_SOCIOS' | 'COMERCIAL';
};

/**
 * 🛡️ Sentinel: Contrast Validation
 * Ensures WCAG AA compliance (4.5:1 ratio)
 */
export function validateThemeContrast(settings: TenantThemeSettings) {
    const ratio = getContrastRatio(settings.primaryColor, settings.backgroundColor || '#ffffff');

    if (ratio < 4.5) {
        return {
            isValid: false,
            ratio,
            verdict: 'REQUIERE CAMBIOS',
            finding: `Contraste insuficiente (${ratio.toFixed(2)}:1). El estándar WCAG AA requiere 4.5:1.`
        };
    }

    return { isValid: true, ratio, verdict: 'APROBADO' };
}

/**
 * 🏗️ Theme Generator
 */
export function generateTenantTheme(tenantSettings: TenantThemeSettings) {
    const { primaryColor, secondaryColor, backgroundColor, businessModel } = tenantSettings;

    // Vanguard defines dynamic mappings
    const themeStyles = {
        '--color-primary': primaryColor,
        '--color-secondary': secondaryColor,
        '--color-background': backgroundColor || '#ffffff',
        '--color-card': businessModel === 'CLUB_SOCIOS' ? '#112240' : '#1A1A1A',
        // Glow effect only for COMERCIAL model
        '--glow-intensity': businessModel === 'COMERCIAL' ? '0 0 15px rgba(57, 255, 20, 0.5)' : 'none',
    };

    return themeStyles;
}
