/**
 * 🛡️ SENTINEL: Lead Validation Utilities
 * Shared validation logic for leads and emails
 * can be used by Server Actions and other components
 */

/**
 * Valida email contra dominios temporales y spam
 */
export function validateEmailDomain(email: string): { valid: boolean; reason?: string } {
    // Lista de dominios temporales/desechables conocidos
    const tempEmailDomains = [
        'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
        'throwaway.email', 'temp-mail.org', 'getnada.com', 'mohmal.com',
        'trashmail.com', 'maildrop.cc', 'yopmail.com', 'emailondeck.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain) {
        return { valid: false, reason: 'Invalid email format' };
    }

    // Verificar si es dominio temporal
    if (tempEmailDomains.includes(domain)) {
        return { valid: false, reason: 'Temporary email domain detected' };
    }

    // Verificar dominios sospechosos (solo números o muy cortos)
    if (domain.length < 4 || /^\d+\.\w+$/.test(domain)) {
        return { valid: false, reason: 'Suspicious domain format' };
    }

    return { valid: true };
}

/**
 * 🛡️ SENTINEL: Detecta comportamiento de bot
 * @param formFillTime - Tiempo en segundos que tomó llenar el formulario
 */
export function detectBotBehavior(formFillTime: number): boolean {
    // Humanos tardan mínimo 2 segundos en llenar un formulario
    const MIN_HUMAN_TIME = 2;

    if (formFillTime < MIN_HUMAN_TIME) {
        return true; // Bot detectado
    }

    return false;
}
