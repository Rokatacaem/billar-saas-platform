import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateWebhookSignature, generateIdempotencyKey } from '@/lib/security/webhook-validator';
import { logSecurityEvent, ThreatLevel } from '@/lib/security/intrusion-detector';
import { apiLimiter, checkRateLimit } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

/**
 * Webhook Endpoint para Pagos (Stripe/Webpay)
 * 🔐 SECURITY: Validación HMAC + Idempotencia
 */
export async function POST(req: Request) {
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // 🛡️ SECURITY: Rate limiting específico para webhooks
    const rateLimitKey = `webhook:${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, apiLimiter);

    if (!rateLimit.allowed) {
        await logSecurityEvent({
            type: 'WEBHOOK_RATE_LIMIT',
            severity: ThreatLevel.HIGH,
            message: `Webhook rate limit exceeded from ${clientIP}`,
            ip: clientIP,
            details: { retryAfter: rateLimit.retryAfter }
        });

        return NextResponse.json(
            { error: 'Rate limit exceeded' },
            {
                status: 429,
                headers: { 'Retry-After': String(rateLimit.retryAfter || 60) }
            }
        );
    }

    try {
        // Leer body crudo (necesario para validar firma)
        const rawBody = await req.text();

        // Detectar proveedor por headers
        const stripeSignature = req.headers.get('stripe-signature');
        const webpaySignature = req.headers.get('x-webpay-signature');

        let provider: 'stripe' | 'webpay' | null = null;
        let signature: string | null = null;

        if (stripeSignature) {
            provider = 'stripe';
            signature = stripeSignature;
        } else if (webpaySignature) {
            provider = 'webpay';
            signature = webpaySignature;
        } else {
            await logSecurityEvent({
                type: 'WEBHOOK_INVALID_PROVIDER',
                severity: ThreatLevel.HIGH,
                message: 'Webhook request without valid provider signature',
                ip: clientIP,
                details: { headers: Object.fromEntries(req.headers.entries()) }
            });

            return NextResponse.json(
                { error: 'Missing signature header' },
                { status: 401 }
            );
        }

        // 🔐 VALIDAR FIRMA HMAC
        const isValidSignature = validateWebhookSignature(provider, rawBody, signature);

        if (!isValidSignature) {
            await logSecurityEvent({
                type: 'WEBHOOK_INVALID_SIGNATURE',
                severity: ThreatLevel.CRITICAL,
                message: `Invalid webhook signature from ${provider}`,
                ip: clientIP,
                details: { provider }
            });

            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parsear evento
        const event = JSON.parse(rawBody);

        // Extraer datos relevantes según proveedor
        let eventId: string;
        let tenantId: string;
        let amount: number;
        let timestamp: number;

        if (provider === 'stripe') {
            eventId = event.id;
            // Ajustar según estructura real de Stripe
            tenantId = event.data?.object?.metadata?.tenantId;
            amount = event.data?.object?.amount / 100; // Stripe usa centavos
            timestamp = event.created;
        } else {
            // Webpay
            eventId = event.transaction_id || event.id;
            tenantId = event.metadata?.tenantId;
            amount = event.amount;
            timestamp = Math.floor(Date.now() / 1000);
        }

        if (!eventId || !tenantId || !amount) {
            await logSecurityEvent({
                type: 'WEBHOOK_INVALID_PAYLOAD',
                severity: ThreatLevel.MEDIUM,
                message: 'Webhook missing required fields',
                ip: clientIP,
                details: { provider, eventId, tenantId }
            });

            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 }
            );
        }

        // 🔐 GENERAR CLAVE DE IDEMPOTENCIA
        const idempotencyKey = generateIdempotencyKey(eventId, amount, timestamp);

        // Verificar si ya procesamos este evento
        const existingRecord = await prisma.paymentRecord.findUnique({
            where: { idempotencyKey }
        });

        if (existingRecord) {
            console.log(`✅ Webhook already processed (idempotency): ${eventId}`);

            return NextResponse.json({
                received: true,
                duplicate: true,
                message: 'Event already processed'
            });
        }

        // 💰 PROCESAR PAGO
        await prisma.paymentRecord.create({
            data: {
                tenantId,
                amount,
                method: provider.toUpperCase(),
                status: 'COMPLETED',
                idempotencyKey,
                webhookData: event, // Guardar payload completo para auditoría
                createdAt: new Date(timestamp * 1000)
            }
        });

        // 🛡️ SECURITY: Log successful payment
        await logSecurityEvent({
            type: 'PAYMENT_WEBHOOK_PROCESSED',
            severity: ThreatLevel.LOW,
            message: `Payment processed via ${provider}`,
            tenantId,
            details: {
                provider,
                amount,
                eventId,
                idempotencyKey
            }
        });

        console.log(`✅ Payment webhook processed: ${eventId} - ${amount}`);

        return NextResponse.json({
            received: true,
            processed: true,
            eventId
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);

        await logSecurityEvent({
            type: 'WEBHOOK_PROCESSING_ERROR',
            severity: ThreatLevel.HIGH,
            message: 'Failed to process payment webhook',
            ip: clientIP,
            details: { error: error.message }
        });

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
