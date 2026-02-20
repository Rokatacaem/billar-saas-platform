/**
 * 🛡️ SENTINEL: Validador de RUT Chileno (Módulo 11)
 *
 * Utilizado para validar el RUT del Emisor (Tenant) y del Receptor (Cliente)
 * antes de emitir un Documento Tributario Electrónico (DTE).
 */

export function cleanRut(rut: string): string {
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(rut: string): string {
    const cleaned = cleanRut(rut);
    if (cleaned.length < 2) return cleaned;

    const dv = cleaned.slice(-1);
    let body = cleaned.slice(0, -1);

    // Add dots every 3 digits
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${body}-${dv}`;
}

export function validateRut(rut: string): boolean {
    if (!rut || typeof rut !== 'string') return false;

    const cleaned = cleanRut(rut);
    if (cleaned.length < 8) return false;

    const dv = cleaned.slice(-1);
    let body = parseInt(cleaned.slice(0, -1), 10);

    if (isNaN(body)) return false;

    // Módulo 11 Algorithm
    let sum = 0;
    let multiplier = 2;

    while (body > 0) {
        sum += (body % 10) * multiplier;
        body = Math.floor(body / 10);
        multiplier = multiplier < 7 ? multiplier + 1 : 2;
    }

    const expectedDv = 11 - (sum % 11);
    let expectedDvString = expectedDv.toString();

    if (expectedDv === 11) expectedDvString = '0';
    if (expectedDv === 10) expectedDvString = 'K';

    return dv === expectedDvString;
}
