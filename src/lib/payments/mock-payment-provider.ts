import { PaymentProvider, PaymentIntentRequest, PaymentIntentResponse, WebhookPayload, WebhookVerificationResult } from './payment-provider.interface';
import crypto from 'crypto';

export class MockPaymentProvider implements PaymentProvider {

    // Una clave secreta ficticia para simular las firmas criptográficas de Webhooks
    private readonly MOCK_WEBHOOK_SECRET = process.env.MOCK_WEBHOOK_SECRET || 'billar-saas-mock-secret';

    async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
        console.log(`[MockPayment Gateway] Creando intención por $${request.amount} (Ref: ${request.referenceId})`);

        const transactionId = `txn_${crypto.randomBytes(8).toString('hex')}`;

        // Simular latencia
        await new Promise(r => setTimeout(r, 600));

        // Firmar la URL de pago autogestionada (una vista MOCK dentro del mismo SaaS)
        const payload = `${transactionId}|${request.amount}|${request.referenceId}`;
        const signature = crypto.createHmac('sha256', this.MOCK_WEBHOOK_SECRET).update(payload).digest('hex');

        // Esta URL apunta a una página UI donde el usuario dará click en "Simular Pago Realizado"
        const paymentUrl = `/mock-checkout?txn=${transactionId}&ref=${request.referenceId}&amount=${request.amount}&sig=${signature}`;

        return {
            success: true,
            transactionId,
            paymentUrl
        };
    }

    async verifyPayment(token: string): Promise<WebhookVerificationResult> {
        // En este mock simplificado, asume verificación manual directa si fuera necesario
        return { isValid: false, error: 'Not Supported in Mock. Use Webhook.' };
    }

    async handleWebhook(payload: WebhookPayload): Promise<WebhookVerificationResult> {
        console.log(`[MockPayment Gateway] Recibiendo Webhook Payload...`);

        try {
            // Un Webhook real envía JSON con datos de la transacción
            // Simularemos que el rawBody viene estructurado como un string delimitado o JSON stringificado
            const data = JSON.parse(payload.rawBody);

            // Re-firmamos para verificar que nadie inyectó un payload trucho
            const localPayload = `${data.transactionId}|${data.amount}|${data.referenceId}`;
            const expectedSignature = crypto.createHmac('sha256', this.MOCK_WEBHOOK_SECRET).update(localPayload).digest('hex');

            if (payload.signature !== expectedSignature) {
                console.error(`[MockPayment Sentinel] Firma de Webhook INVÁLIDA.`);
                return { isValid: false, error: 'Invalid Signature' };
            }

            console.log(`[MockPayment Sentinel] Firma validada exitosamente para ${data.referenceId}`);

            return {
                isValid: true,
                status: 'PAID', // Simulamos que el Webhook es solo para confirmaciones exitosas
                transactionId: data.transactionId,
                referenceId: data.referenceId,
                amount: data.amount
            };

        } catch (error: any) {
            return { isValid: false, error: `JSON Parse error: ${error.message}` };
        }
    }
}

export const paymentProvider = new MockPaymentProvider();
