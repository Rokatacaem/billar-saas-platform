'use client';

import { useEffect } from 'react';

/**
 * Propiedades del Tema de Apariencia Elite Mínima
 */
interface ThemeConfig {
    primaryColor: string;
    secondaryColor?: string;
    backgroundColor?: string;
    uiConfig?: {
        radius?: string;
        darkMode?: boolean;
        fontFamily?: string;
        texture?: string;
        tableStyle?: string;
    } | null;
}

export default function ThemeProvider({
    children,
    theme
}: {
    children: React.ReactNode,
    theme: ThemeConfig
}) {
    useEffect(() => {
        // Obtenemos o creamos la etiqueta style dinámicamente
        let styleEl = document.getElementById('tenant-theme-variables');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'tenant-theme-variables';
            document.head.appendChild(styleEl);
        }

        const primary = theme.primaryColor || '#1a4d2e';
        const secondary = theme.secondaryColor || '#ffffff';
        const bg = theme.backgroundColor || '#ffffff';
        const radius = theme.uiConfig?.radius || '0.75rem';

        // Generamos tonos derivados calculando "lightness"
        // En un MVP avanzado esto lo hace polished/d3-color, aquí
        // usaremos opacidad u opacidades precalculadas de Tailwind:

        styleEl.innerHTML = `
            :root {
                --theme-primary: ${primary};
                --theme-primary-transparent: ${primary}20; /* 12% opacity */
                --theme-primary-hover: ${primary}dd; /* slightly darker/transparent */
                
                --theme-secondary: ${secondary};
                --theme-bg: ${bg};
                
                --theme-radius: ${radius};
            }
        `;

        // Apply text color and table style class depending on background for <html> level
        if (theme.uiConfig?.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        const wrapper = document.getElementById('vanguard-root-wrapper');
        if (wrapper) {
            wrapper.setAttribute('data-table-style', theme.uiConfig?.tableStyle || 'classic');

            // Texture injection
            if (theme.uiConfig?.texture === 'cloth') {
                wrapper.style.backgroundImage = "url('https://www.transparenttextures.com/patterns/woven-light.png')";
                wrapper.style.backgroundBlendMode = "multiply";
            } else if (theme.uiConfig?.texture === 'marble') {
                wrapper.style.backgroundImage = "url('https://www.transparenttextures.com/patterns/white-marble.png')";
                wrapper.style.backgroundBlendMode = "overlay";
            } else {
                wrapper.style.backgroundImage = 'none';
            }
        }

    }, [theme]);

    return (
        <div id="vanguard-root-wrapper" className="w-full h-full min-h-screen bg-[var(--theme-bg)] transition-colors duration-500">
            {children}
        </div>
    );
}
