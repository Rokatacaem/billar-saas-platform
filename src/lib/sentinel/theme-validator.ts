/**
 * Sentinel: Theme Validator (WCAG 2.1)
 * Evalúa las preferencias de apariencia (White-Labeling) de los Tenants
 * asegurando una legibilidad mínima según estándares de la W3C.
 */

// Extrae los componentes RGB de un color Hex
function parseHex(hex: string): { r: number, g: number, b: number } {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

// Calcula la Luminancia Relativa según WCAG
// https://www.w3.org/TR/WCAG20/#relativeluminancedef
function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calcula el ratio de contraste entre dos colores HEX.
 * Retorna un valor >= 1 y <= 21. Para texto normal WCAG AA pide >= 4.5.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
    try {
        const rgb1 = parseHex(hex1);
        const rgb2 = parseHex(hex2);

        const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

        const lightest = Math.max(l1, l2);
        const darkest = Math.min(l1, l2);

        return (lightest + 0.05) / (darkest + 0.05);
    } catch (e) {
        console.warn("[Sentinel] Error calculando contraste, asumiendo ratio mínimo.");
        return 1.0;
    }
}

/**
 * Validador Sentinel principal para configuraciones de Theme.
 */
export function validateThemeColors(primary: string, background: string): { valid: boolean; ratio: number; message?: string } {
    if (!primary || !background) return { valid: false, ratio: 0, message: "Colores no definidos." };

    const ratio = getContrastRatio(primary, background);

    // WCAG AA Require 4.5:1 for normal text, 3:1 for large text/ui components.
    // Usaremos 3.0:1 como límite legal bloqueante para botones e UI.
    const isAccessible = ratio >= 3.0;

    return {
        valid: isAccessible,
        ratio: Number(ratio.toFixed(2)),
        message: isAccessible
            ? "Contraste óptimo y accesible."
            : `Alerta Sentinel: El contraste actual (${ratio.toFixed(2)}:1) viola las políticas de accesibilidad. Utiliza colores más distintivos.`
    };
}
