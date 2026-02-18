import { Tenant } from "@prisma/client";

/**
 * Formats a currency amount based on the tenant's locale and currency settings.
 * @param amount The numerical amount to format.
 * @param tenant The tenant context containing locale and currency info.
 * @returns Formatted string (e.g. "$ 1.000" or "€ 1,00")
 */
export function formatCurrency(amount: number, tenant: Partial<Tenant>): string {
    const locale = tenant.locale || 'es-CL';
    const currency = tenant.currencyCode || 'CLP';

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            currencyDisplay: 'symbol',
            minimumFractionDigits: 0, // En CLP no se usan decimales comúnmente, ajustar según moneda?
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        console.error("Error formatting currency:", error);
        return `$ ${amount}`; // Fallback
    }
}

/**
 * Converts a UTC date to the tenant's local time string.
 * @param date UTC Date object
 * @param timezone IANA Timezone string (e.g., 'America/Santiago')
 * @returns ISO string representation in local time or formatted string
 */
export function toTenantTime(date: Date, timezone: string = 'America/Santiago'): Date {
    // This is a simplified approach. For robust handling, libraries like 'date-fns-tz' are recommended.
    // However, to keep it lightweight, we can rely on Intl or simple offset calculation if needed.
    // For now, returning the date object as is, assuming the UI handles display via .toLocaleDateString
    return date;
}

/**
 * Returns the current date in the tenant's timezone (start of day)
 */
export function getTenantToday(timezone: string = 'America/Santiago'): Date {
    const now = new Date();
    const localString = now.toLocaleString("en-US", { timeZone: timezone });
    const localDate = new Date(localString);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
}

export const COUNTRY_PRESETS = {
    CL: {
        name: "Chile",
        currencyCode: "CLP",
        currencySymbol: "$",
        locale: "es-CL",
        timezone: "America/Santiago",
        taxRate: 0.19,
        taxName: "IVA"
    },
    PE: {
        name: "Perú",
        currencyCode: "PEN",
        currencySymbol: "S/",
        locale: "es-PE",
        timezone: "America/Lima",
        taxRate: 0.18,
        taxName: "IGV"
    },
    MX: {
        name: "México",
        currencyCode: "MXN",
        currencySymbol: "$",
        locale: "es-MX",
        timezone: "America/Mexico_City",
        taxRate: 0.16,
        taxName: "IVA"
    },
    ES: {
        name: "España",
        currencyCode: "EUR",
        currencySymbol: "€",
        locale: "es-ES",
        timezone: "Europe/Madrid",
        taxRate: 0.21,
        taxName: "IVA"
    }
};
