export interface PaymentIntentRequest {
    tenantId: string;
    amount: number;
    referenceId: string; // Ej: 'MEM_cuid123' o 'TAB_cuid456'
    description: string;
    customerEmail?: string;
}

export interface PaymentIntentResponse {
    success: boolean;
    transactionId?: string; // ID en la Pasarela
    paymentUrl?: string; // Link para redireccionar al usuario
    error?: string;
}

export interface WebhookPayload {
    rawBody: string;
    signature: string;
}

export interface WebhookVerificationResult {
    isValid: boolean;
    transactionId?: string;
    referenceId?: string;
    status?: 'PAID' | 'FAILED' | 'PENDING';
    amount?: number;
    error?: string;
}

/**
 * Capa de Abstracción para integraciones de Pago.
 * Implementaciones concretas pueden ser Stripe, Webpay Plus (Transbank), MercadoPago, etc.
 */
export interface PaymentProvider {
    /**
     * Crea una intención de cobro y devuelve la URL a donde se enviará al usuario.
     */
    createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse>;

    /**
     * Usado si la pasarela no maneja Webhooks sino redirección con Token
     */
    verifyPayment(token: string): Promise<WebhookVerificationResult>;

    /**
     * Valida de forma criptográfica un Payload entrante desde la Pasarela y extrae los datos canonizados.
     */
    handleWebhook(payload: WebhookPayload): Promise<WebhookVerificationResult>;
}
