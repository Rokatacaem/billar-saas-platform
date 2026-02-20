/**
 * Elite Theme Presets
 * Este catálogo exporta plantillas visuales diseñadas bajo los principios
 * de inmersión y White-Labeling de Billar SaaS (WOR).
 */

export interface ThemePreset {
    id: string;
    name: string;
    description: string;
    uiConfig: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        fontFamily: "Merriweather" | "Inter" | "Montserrat" | string;
        radius: string; // ej. "4px", "12px", "0px"
        texture: "cloth" | "solid" | "marble";
        tableStyle: "classic" | "neon" | "minimal";
        darkMode: boolean;
    };
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
    classic: {
        id: "classic",
        name: "Heritage Club",
        description: "Estilo conservador con maderas, verde inglés y tipografía Serif.",
        uiConfig: {
            primaryColor: "#065f46", // Verde esmeralda oscuro
            secondaryColor: "#8B4513", // Tono madera (SaddleBrown)
            backgroundColor: "#f8fafc",
            fontFamily: "Merriweather", // Serif
            radius: "4px", // Ligeramente redondeado
            texture: "cloth", // Paño de billar
            tableStyle: "classic", // Patas de madera
            darkMode: false,
        }
    },
    modern: {
        id: "modern",
        name: "Neon Billiards",
        description: "Enfoque urbano, dinámico y redondeado con toques cyan.",
        uiConfig: {
            primaryColor: "#06b6d4", // Cyan
            secondaryColor: "#1e293b", // Slate oscuro
            backgroundColor: "#0f172a", // Fondo oscuro (slate-900)
            fontFamily: "Inter", // Sans-serif moderna
            radius: "12px", // Muy redondeado (Burbuja)
            texture: "solid",
            tableStyle: "neon", // Luces LED
            darkMode: true,
        }
    },
    luxury: {
        id: "luxury",
        name: "Golden Crown",
        description: "Diseño minimalista premium, esquinas afiladas y tonos dorados.",
        uiConfig: {
            primaryColor: "#d4af37", // Dorado
            secondaryColor: "#000000", // Negro absoluto
            backgroundColor: "#ffffff", // Blanco nevado
            fontFamily: "Montserrat", // Geométrica y limpia
            radius: "0px", // Esquinas afiladas, diseño brutalista de lujo
            texture: "marble", // Textura suave tipo mármol
            tableStyle: "minimal", // Mesa fina de lujo
            darkMode: false,
        }
    }
};

/**
 * Retorna las opciones disponibles para el Live Switcher Frontend
 */
export const getAvailablePresets = () => Object.values(THEME_PRESETS);
