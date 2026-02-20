import { BillingProvider, EmissionRequest, EmissionResponse } from './billing-provider.interface';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export class MockBillingProvider implements BillingProvider {

    async emitDocument(request: EmissionRequest): Promise<EmissionResponse> {
        console.log(`[MockBillingProvider] Preparando emisión DTE tipo ${request.tipoDTE}...`);

        // 🛡️ Sentinel: Validación Matemática Estricta
        // Total = Neto + (Neto * taxRate/100) -> En términos prácticos: Total = Neto + IVA
        const calculatedTotal = Number((request.montoNeto + request.montoIva).toFixed(2));
        const expectedTotal = Number(request.montoTotal.toFixed(2));

        if (calculatedTotal !== expectedTotal) {
            console.error(`[Sentinel] Inconsistencia tributaria detectada en DTE: Neto(${request.montoNeto}) + IVA(${request.montoIva}) = ${calculatedTotal}. Se esperaba: ${expectedTotal}.`);
            return {
                success: false,
                status: 'FAILED',
                error: 'Validación Sentinel fallida: El desglose de impuestos no cuadra con el total.'
            };
        }

        // Simulación: Espera artificial de 800ms para simular red
        await new Promise(resolve => setTimeout(resolve, 800));

        // Obtener siguiente folio disponible usando la DB
        let folioDTE = 0;

        try {
            // Buscamos correlativo y lo incrementamos atómicamente
            const range = await prisma.folioRange.upsert({
                where: {
                    tenantId_tipoDTE: {
                        tenantId: request.tenantId,
                        tipoDTE: request.tipoDTE
                    }
                },
                create: {
                    tenantId: request.tenantId,
                    tipoDTE: request.tipoDTE,
                    startFolio: 1,
                    endFolio: 1000000,
                    currentFolio: 1
                },
                update: {
                    currentFolio: { increment: 1 }
                }
            });
            folioDTE = range.currentFolio;
        } catch (e) {
            console.warn('[MockBillingProvider] Falló obtención de correlativo por DB, usando random mode.', e);
            folioDTE = Math.floor(Math.random() * 90000) + 10000;
        }

        // Generación de Hash para URL de Verificación (QR)
        const hashPayload = `${request.tenantId}|${request.tipoDTE}|${folioDTE}|${request.montoTotal}`;
        const signature = crypto.createHash('sha256').update(hashPayload).digest('hex').substring(0, 16);

        // Boilerplate para un QR usando goqr.me (público)
        // La URL apunta teóricamente al endpoint del saas para consultar la validez del documento
        const verificationUrl = `https://billar-saas.local/verify/dte/${request.tenantId}/${request.tipoDTE}/${folioDTE}?sig=${signature}`;
        const qrContent = encodeURIComponent(verificationUrl);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrContent}`;

        console.log(`[MockBillingProvider] Emisión Exitosa. DTE: ${request.tipoDTE} Folio: ${folioDTE}`);

        return {
            success: true,
            status: 'GENERATED',
            folio: folioDTE,
            urlCertificado: qrUrl,
            xmlString: `<mock><dte>${request.tipoDTE}</dte><folio>${folioDTE}</folio><total>${request.montoTotal}</total></mock>`
        };
    }
}

// Singleton Factory para inyectar globalmente
export const billingProvider = new MockBillingProvider();
