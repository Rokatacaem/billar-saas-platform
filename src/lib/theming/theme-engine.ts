import { BusinessModel } from '@prisma/client';

/**
 * Theme Configuration Interface
 */
export interface ThemeConfig {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        text: {
            primary: string;
            secondary: string;
            accent: string;
        };
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        headingWeight: number;
    };
    effects: {
        borderRadius: string;
        shadowIntensity: 'soft' | 'medium' | 'strong';
        glowEnabled: boolean;
    };
}

/**
 * 🏛️ HERITAGE ELITE THEME
 * For CLUB_SOCIOS model - Sophisticated, traditional, exclusive
 */
export const HERITAGE_ELITE_THEME: ThemeConfig = {
    name: 'Heritage Elite',
    colors: {
        primary: '#0A192F',      // Deep navy night
        secondary: '#D4AF37',    // Brushed gold
        accent: '#FFF8E7',       // Ivory white
        background: '#0A192F',
        surface: 'rgba(212, 175, 55, 0.05)', // Gold tint glass
        text: {
            primary: '#FFF8E7',
            secondary: '#C4B5A0',
            accent: '#D4AF37'
        }
    },
    typography: {
        headingFont: '"Playfair Display", serif',
        bodyFont: '"Inter", sans-serif',
        headingWeight: 600
    },
    effects: {
        borderRadius: '12px',
        shadowIntensity: 'soft',
        glowEnabled: false
    }
};

/**
 * ⚡ NEON HIGH-VOLTAGE THEME
 * For COMERCIAL model - Energetic, modern, urgent
 */
export const NEON_HIGH_VOLTAGE_THEME: ThemeConfig = {
    name: 'Neon High-Voltage',
    colors: {
        primary: '#000000',      // Absolute black
        secondary: '#39FF14',    // Neon green
        accent: '#FF6B35',       // Electric orange
        background: '#000000',
        surface: 'rgba(57, 255, 20, 0.08)', // Neon glow
        text: {
            primary: '#FFFFFF',
            secondary: '#B0B0B0',
            accent: '#39FF14'
        }
    },
    typography: {
        headingFont: '"Rajdhani", sans-serif',
        bodyFont: '"Roboto", sans-serif',
        headingWeight: 700
    },
    effects: {
        borderRadius: '4px',
        shadowIntensity: 'strong',
        glowEnabled: true
    }
};

/**
 * Get theme configuration based on business model
 */
export function getThemeForBusinessModel(model: BusinessModel): ThemeConfig {
    return model === 'CLUB_SOCIOS'
        ? HERITAGE_ELITE_THEME
        : NEON_HIGH_VOLTAGE_THEME;
}

/**
 * Generate CSS custom properties from theme config
 */
export function generateCSSVariables(theme: ThemeConfig): string {
    return `
        --color-primary: ${theme.colors.primary};
        --color-secondary: ${theme.colors.secondary};
        --color-accent: ${theme.colors.accent};
        --color-background: ${theme.colors.background};
        --color-surface: ${theme.colors.surface};
        --color-text-primary: ${theme.colors.text.primary};
        --color-text-secondary: ${theme.colors.text.secondary};
        --color-text-accent: ${theme.colors.text.accent};
        
        --font-heading: ${theme.typography.headingFont};
        --font-body: ${theme.typography.bodyFont};
        --font-heading-weight: ${theme.typography.headingWeight};
        
        --border-radius: ${theme.effects.borderRadius};
        --shadow-intensity: ${theme.effects.shadowIntensity};
        --glow-enabled: ${theme.effects.glowEnabled ? '1' : '0'};
    `;
}

/**
 * Get shadow style based on intensity
 */
export function getShadowStyle(intensity: 'soft' | 'medium' | 'strong'): string {
    switch (intensity) {
        case 'soft':
            return '0 2px 8px rgba(0, 0, 0, 0.1)';
        case 'medium':
            return '0 4px 16px rgba(0, 0, 0, 0.2)';
        case 'strong':
            return '0 8px 32px rgba(0, 0, 0, 0.4)';
    }
}
