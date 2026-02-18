import crypto from 'crypto';

/**
 * Webhook Security Validator
 * Valida firmas HMAC de webhooks de Stripe y Webpay
 */

/**
 * Valida firma de webhook de Stripe
 * @param rawBody - Body crudo del request (Buffer o string)
 * @param signature - Header "stripe-signature"
 * @param secret - WEBHOOK_SECRET_STRIPE desde env
 * @returns true si la firma es válida
 */
export function validateStripeSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string
): boolean {
    try {
        // Stripe usa formato: t=timestamp,v1=signature
        const elements = signature.split(',');
        const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
        const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

        if (!timestamp || !signatureHash) {
            console.error('⚠️ Invalid Stripe signature format');
            return false;
        }

        // Verificar que timestamp no sea muy antiguo (5 min tolerance)
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = currentTime - parseInt(timestamp);

        if (timeDiff > 300) {
            console.error('⚠️ Stripe webhook timestamp too old');
            return false;
        }

        // Construir payload firmado
        const payload = `${timestamp}.${rawBody}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload, 'utf8')
            .digest('hex');

        // Comparación timing-safe
        return crypto.timingSafeEqual(
            Buffer.from(signatureHash),
            Buffer.from(expectedSignature)
        );

    } catch (error) {
        console.error('Stripe signature validation error:', error);
        return false;
    }
}

/**
 * Valida firma de webhook de Webpay (Transbank)
 * @param rawBody - Body crudo del request
 * @param signature - Header "x-webpay-signature"
 * @param secret - WEBHOOK_SECRET_WEBPAY desde env
 * @returns true si la firma es válida
 */
export function validateWebpaySignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string
): boolean {
    try {
        // Webpay (Transbank) usa HMAC-SHA256
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('base64');

        // Comparación timing-safe
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

    } catch (error) {
        console.error('Webpay signature validation error:', error);
        return false;
    }
}

/**
 * Genera clave de idempotencia desde datos del evento
 * @param eventId - ID único del evento de la pasarela
 * @param amount - Monto del pago
 * @param timestamp - Timestamp del evento
 * @returns Hash único para este evento
 */
export function generateIdempotencyKey(
    eventId: string,
    amount: number,
    timestamp: number
): string {
    const payload = `${eventId}:${amount}:${timestamp}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Valida webhook según proveedor detectado
 */
export function validateWebhookSignature(
    provider: 'stripe' | 'webpay',
    rawBody: string | Buffer,
    signature: string
): boolean {
    if (provider === 'stripe') {
        const secret = process.env.WEBHOOK_SECRET_STRIPE;
        if (!secret) {
            console.error('❌ WEBHOOK_SECRET_STRIPE not configured');
            return false;
        }
        return validateStripeSignature(rawBody, signature, secret);
    } else if (provider === 'webpay') {
        const secret = process.env.WEBHOOK_SECRET_WEBPAY;
        if (!secret) {
            console.error('❌ WEBHOOK_SECRET_WEBPAY not configured');
            return false;
        }
        return validateWebpaySignature(rawBody, signature, secret);
    }

    return false;
}
