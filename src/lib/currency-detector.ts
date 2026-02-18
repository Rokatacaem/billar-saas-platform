/**
 * Currency & Location Detector
 * Detecta país y moneda del visitante usando IP
 */

interface LocationData {
    country: string;
    countryName: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
}

/**
 * Detecta ubicación del visitante por IP
 * @param ip - IP del cliente (opcional, auto-detectada en server)
 * @returns LocationData con país, moneda, etc.
 */
export async function detectLocation(ip?: string): Promise<LocationData> {
    const fallback: LocationData = {
        country: 'CL',
        countryName: 'Chile',
        currency: 'CLP',
        currencySymbol: '$',
        timezone: 'America/Santiago'
    };

    try {
        // En desarrollo, usar IP pública de testing o fallback
        const targetIp = ip || (process.env.NODE_ENV === 'development' ? '' : 'auto');

        // API gratuita ipapi.co (1000 req/día sin key)
        const url = targetIp
            ? `https://ipapi.co/${targetIp}/json/`
            : 'https://ipapi.co/json/';

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Billar-SaaS/1.0'
            },
            next: { revalidate: 3600 } // Cache por 1 hora
        });

        if (!response.ok) {
            console.warn('⚠️ IP geolocation API failed, using fallback');
            return fallback;
        }

        const data = await response.json();

        return {
            country: data.country_code || 'CL',
            countryName: data.country_name || 'Chile',
            currency: data.currency || 'CLP',
            currencySymbol: getCurrencySymbol(data.currency || 'CLP'),
            timezone: data.timezone || 'America/Santiago'
        };

    } catch (error) {
        console.error('Currency detection error:', error);
        return fallback;
    }
}

/**
 * Mapea código de moneda a símbolo
 */
function getCurrencySymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'CLP': '$',
        'MXN': '$',
        'ARS': '$',
        'PEN': 'S/',
        'COP': '$',
        'BRL': 'R$'
    };

    return symbols[currencyCode] || currencyCode;
}

/**
 * Convierte precio base (USD) a moneda local
 * Tasas de cambio aproximadas (actualizar con API real en producción)
 */
export function convertPrice(baseUSD: number, targetCurrency: string): number {
    const rates: Record<string, number> = {
        'USD': 1,
        'CLP': 900,
        'MXN': 17,
        'ARS': 850,
        'PEN': 3.7,
        'EUR': 0.92,
        'COP': 4000,
        'BRL': 5
    };

    return Math.round(baseUSD * (rates[targetCurrency] || 1));
}

/**
 * Formatea precio según moneda
 */
export function formatPrice(amount: number, currency: string, locale: string = 'es-CL'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
