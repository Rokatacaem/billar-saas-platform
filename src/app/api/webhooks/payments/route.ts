import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentProvider } from '@/lib/payments/mock-payment-provider';
import { billingProvider } from '@/lib/billing/mock-billing-provider';
import { calculateTaxBreakdown } from '@/app/actions/tax-actions';

// 🛡️ Webhook Receiver: El Oído del Sistema SaaS
// Esta ruta es pública, pero protegida criptográficamente por la firma del Webhook
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-webhook-signature');

        if (!signature) {
            console.error('[Sentinel] Hook rechazado: Falta Header x-webhook-signature');
            return NextResponse.json({ error: 'Falta Firma (Missing Signature)' }, { status: 401 });
        }

        // 1. Delegar auditoría criptográfica al Pago Provider abstracto
        const verification = await paymentProvider.handleWebhook({
            rawBody,
            signature
        });

        if (!verification.isValid || !verification.referenceId) {
            console.error('[Sentinel] Hook rechazado: Payload o Firma Inválida');
            return NextResponse.json({ error: 'Validación Criptográfica Fallida' }, { status: 403 });
        }

        console.log(`[Webhook] Pago Confirmado: ${verification.transactionId} | Ref: ${verification.referenceId}`);

        // 2. Efecto Dominó (Sentinel Logic)
        const ref = verification.referenceId;

        // 🔹 A) FLUJO: Pago de Membresía (Suscripción Híbrida)
        if (ref.startsWith('MEM_')) {
            const membershipPaymentId = ref.replace('MEM_', '');

            const payment = await prisma.membershipPayment.findUnique({
                where: { id: membershipPaymentId },
                include: { member: { include: { membershipPlan: true } } }
            });

            if (!payment) return NextResponse.json({ error: 'Pago Membresía no encontrado' }, { status: 404 });

            // 1. Marcar el Pago como PAID
            await prisma.membershipPayment.update({
                where: { id: membershipPaymentId },
                data: { status: 'PAID' }
            });

            // 2. Reactivar al Socio
            const member = payment.member;
            const plan = member.membershipPlan;
            const now = new Date();
            const currentEnd = member.currentPeriodEnd || now;

            const nextDate = new Date(Math.max(now.getTime(), currentEnd.getTime()));
            if (plan?.billingCycle === 'YEARLY') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }

            await prisma.member.update({
                where: { id: member.id },
                data: {
                    subscriptionStatus: 'ACTIVE',
                    currentPeriodEnd: nextDate
                }
            });

            console.log(`[Dominó MEM] Socio ${member.name} activado hasta ${nextDate.toISOString()}`);
            return NextResponse.json({ success: true, processed: 'MEM' });
        }

        // 🔹 B) FLUJO: PAGO DE MESA ACTIVA (QR Checkout)
        if (ref.startsWith('TAB_')) {
            const sessionId = ref.replace('TAB_', ''); // Este es el UsageLogId

            const usageSession = await prisma.usageLog.findUnique({
                where: { id: sessionId },
                include: { table: true }
            });

            if (!usageSession) return NextResponse.json({ error: 'Sesión UsageLog no encontrada' }, { status: 404 });

            // 1. Marcar Sesión pagada (Evitando cobro doble)
            await prisma.usageLog.update({
                where: { id: sessionId },
                data: { paymentStatus: 'PAID' }
            });

            // 2. Liberar la Mesa en el Cockpit Central
            if (usageSession.table.status === 'OCCUPIED' || usageSession.table.status === 'ENDING') {
                // Si seguía ocupada, la mandamos a limpiar
                await prisma.table.update({
                    where: { id: usageSession.table.id },
                    data: { status: 'CLEANING', currentSessionId: null }
                });
                console.log(`[Dominó TAB] Mesa ${usageSession.table.number} liberada (CLEANING).`);
            }

            // 3. Emitir el DTE automáticamente (Doble Integración Hitos)
            // Si la mesa no tenía un DTE ya generado (ej. lo generó en toggleTableStatus), lo emitimos aquí como fallback
            if (!usageSession.folioDTE && usageSession.amountCharged > 0) {
                const taxBreakdown = await calculateTaxBreakdown(usageSession.amountCharged, usageSession.taxRate);
                const dteRes = await billingProvider.emitDocument({
                    tenantId: usageSession.tenantId,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    tipoDTE: (usageSession as any).tipoDTE || 39,
                    montoNeto: taxBreakdown.netAmount,
                    montoIva: taxBreakdown.taxAmount,
                    montoTotal: taxBreakdown.grossAmount
                });

                await prisma.usageLog.update({
                    where: { id: sessionId },
                    data: {
                        folioDTE: dteRes.folio,
                        dteStatus: dteRes.status,
                        urlCertificado: dteRes.urlCertificado
                    }
                });
                console.log(`[Dominó DTE] Ticket/DTE Emitido automáticamente post-pago: Folio ${dteRes.folio}`);
            }

            return NextResponse.json({ success: true, processed: 'TAB' });
        }

        console.error(`[Sentinel] Hook falló: Prefijo de ReferenceId desconocido (${ref})`);
        return NextResponse.json({ error: 'Unknown Reference Prefix' }, { status: 400 });

    } catch (e: unknown) {
        console.error('[Webhook Fatal]', e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
