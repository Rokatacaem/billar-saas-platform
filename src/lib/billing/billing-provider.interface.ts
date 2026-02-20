export interface EmissionRequest {
    tenantId: string;
    tipoDTE: number; // 39 (Boleta), 33 (Factura), 41 (Boleta Exenta)
    montoNeto: number;
    montoIva: number;
    montoTotal: number;
    receptor?: {
        rut: string;
        razonSocial: string;
        giro: string;
    };
    items?: Array<{
        nombre: string;
        cantidad: number;
        precioUnitario: number; // Neto o Bruto dependiendo del tipo
        totalItem: number;
    }>;
}

export interface EmissionResponse {
    success: boolean;
    folio?: number;
    status: 'GENERATED' | 'FAILED' | 'PENDING';
    urlCertificado?: string; // Ej. Codigo QR URL
    urlPdf?: string;
    xmlString?: string;
    error?: string;
}

export interface BillingProvider {
    /**
     * Emite un Documento Tributario Electrónico (DTE) al proveedor asignado (SII, OpenFactura, etc.)
     */
    emitDocument(request: EmissionRequest): Promise<EmissionResponse>;

    /**
     * Valida el estado actual de un DTE emitido previamente
     */
    checkStatus?(folio: number, tipoDTE: number): Promise<EmissionResponse>;
}
