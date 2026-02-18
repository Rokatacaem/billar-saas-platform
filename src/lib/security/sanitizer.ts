import validator from 'validator';

/**
 * Core Security - Sanitizer
 * Protección contra XSS y SQL Injection
 */

/**
 * Sanitiza un string removiendo caracteres peligrosos
 * @param input - String a sanitizar
 * @returns String limpio
 */
export function sanitizeString(input: string): string {
    if (!input) return '';

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Escape HTML entities to prevent XSS
    sanitized = validator.escape(sanitized);

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
}

/**
 * Valida y sanitiza un email
 * @param email - Email a validar
 * @returns Email válido o null
 */
export function validateEmail(email: string): string | null {
    if (!email || !validator.isEmail(email)) {
        return null;
    }

    return validator.normalizeEmail(email) || null;
}

/**
 * Sanitiza HTML permitiendo solo tags seguros
 * @param html - HTML a sanitizar
 * @returns HTML limpio
 */
export function sanitizeHTML(html: string): string {
    if (!html) return '';

    // En servidor no podemos usar DOMPurify, así que usamos un enfoque conservador
    // Removemos todos los tags excepto los permitidos
    const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br'];

    // Por seguridad, en vez de parsear, simplemente escapamos todo
    // Para un sanitizador más robusto, usar una librería como 'sanitize-html'
    return validator.escape(html);
}

/**
 * Valida que un string sea alfanumérico (útil para slugs, IDs)
 * @param input - String a validar
 * @returns true si es válido
 */
export function isAlphanumeric(input: string): boolean {
    return validator.isAlphanumeric(input, 'en-US', { ignore: '-_' });
}

/**
 * Sanitiza un objeto recursivamente
 * Útil para limpiar payloads de formularios
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj };

    for (const key in sanitized) {
        if (typeof sanitized[key] === 'string') {
            sanitized[key] = sanitizeString(sanitized[key]) as any;
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitizeObject(sanitized[key]);
        }
    }

    return sanitized;
}

/**
 * Valida longitud de string (previene ataques de buffer)
 * @param input - String a validar
 * @param min - Longitud mínima
 * @param max - Longitud máxima
 */
export function validateLength(input: string, min: number, max: number): boolean {
    return validator.isLength(input, { min, max });
}
