'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { BusinessModel } from '@prisma/client';
import { getThemeForBusinessModel, generateCSSVariables } from '@/lib/theming/theme-engine';

interface ThemeContextValue {
    businessModel: BusinessModel;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
    children: ReactNode;
    businessModel: BusinessModel;
}

/**
 * ThemeProvider - Inject CSS variables and theme classes based on business model
 */
export function ThemeProvider({ children, businessModel }: ThemeProviderProps) {
    useEffect(() => {
        const theme = getThemeForBusinessModel(businessModel);
        const cssVars = generateCSSVariables(theme);

        // Inject CSS variables into :root
        const style = document.createElement('style');
        style.id = 'dynamic-theme-vars';
        style.textContent = `:root { ${cssVars} }`;

        // Remove previous theme style if exists
        const existingStyle = document.getElementById('dynamic-theme-vars');
        if (existingStyle) {
            existingStyle.remove();
        }

        document.head.appendChild(style);

        // Add theme-specific body class
        document.body.classList.add(`theme-${businessModel.toLowerCase().replace('_', '-')}`);

        // Cleanup
        return () => {
            const styleEl = document.getElementById('dynamic-theme-vars');
            if (styleEl) {
                styleEl.remove();
            }
            document.body.classList.remove(`theme-${businessModel.toLowerCase().replace('_', '-')}`);
        };
    }, [businessModel]);

    return (
        <ThemeContext.Provider value={{ businessModel }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * useTheme hook - Access current theme context
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
