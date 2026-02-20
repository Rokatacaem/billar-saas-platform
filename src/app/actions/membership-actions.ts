'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { calculateTaxBreakdown } from '@/app/actions/tax-actions';
import { billingProvider } from '@/lib/billing/mock-billing-provider';

// TIP: 39=Boleta Afecta, 41=Boleta Honorarios/Exenta
const DTE_AFECTO = 39;
const DTE_EXENTO = 41;

export async function createMembershipPlan(data: { name: string, price: number, isTaxable: boolean, billingCycle: 'MONTHLY' | 'YEARLY' }) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') return { success: false, error: 'No autorizado' };

    try {
        await prisma.membershipPlan.create({
            data: {
                tenantId: session.user.tenantId,
                name: data.name,
                price: Number(data.price),
                isTaxable: data.isTaxable,
                billingCycle: data.billingCycle
            }
        });
        revalidatePath('/tenant/[slug]/admin/members/plans');
        return { success: true };
    } catch (e) {
        console.error("Error creating plan", e);
        return { success: false, error: 'Error al crear plan.' };
    }
}

export async function deleteMembershipPlan(planId: string) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') return { success: false, error: 'No autorizado' };

    try {
        await prisma.membershipPlan.delete({
            where: { id: planId, tenantId: session.user.tenantId }
        });
        revalidatePath('/tenant/[slug]/admin/members/plans');
        return { success: true };
    } catch (e) {
        console.error("Error deleting plan", e);
        return { success: false, error: 'No se puede eliminar un plan en uso.' };
    }
}

export async function createMembershipPayment(memberId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'No autorizado' };

    const tenantId = session.user.tenantId;

    try {
        const member = await prisma.member.findUnique({
            where: { id: memberId, tenantId },
            include: { membershipPlan: true }
        });

        if (!member) return { success: false, error: 'Socio no encontrado' };
        if (!member.membershipPlan) return { success: false, error: 'Socio no tiene plan asignado' };

        const plan = member.membershipPlan;

        let subtotal = plan.price;
        let taxAmount = 0;
        let dteType = DTE_EXENTO; // Default to Exento

        // 🛡️ Sentinel: Cálculo dinámico de impuesto y DTE
        if (plan.isTaxable) {
            const tenantConfig = await prisma.tenant.findUnique({
                where: { id: tenantId }, select: { taxRate: true }
            });
            const rate = tenantConfig?.taxRate || 0.19;

            // Extraemos el IVA del precio bruto del plan
            const breakdown = await calculateTaxBreakdown(plan.price, rate);
            subtotal = breakdown.netAmount;
            taxAmount = breakdown.taxAmount;
            dteType = DTE_AFECTO;
        }

        // Sentinel: Consistencia Check. Previene errores de suma (Neto + IVA = Price)
        if (Number((subtotal + taxAmount).toFixed(2)) !== Number(plan.price.toFixed(2))) {
            console.error(`Inconsistencia Tributaria detectada en Plan ${plan.name}. Neto:${subtotal} IVA:${taxAmount} BrutoEsperado:${plan.price}`);
            // En un entorno de producción, aquí se gatilla SystemLog
        }

        // 🚀 SII Connect: Emisión a través de Provider
        const dtRes = await billingProvider.emitDocument({
            tenantId,
            tipoDTE: dteType,
            montoNeto: subtotal,
            montoIva: taxAmount,
            montoTotal: plan.price
        });

        // Crear el pago inmutable
        const payment = await prisma.membershipPayment.create({
            data: {
                tenantId,
                memberId: member.id,
                amount: plan.price, // Siempre es el price total pagado
                taxAmount,
                dteType,
                folioDTE: dtRes.folio,
                dteStatus: dtRes.status,
                urlCertificado: dtRes.urlCertificado
            }
        });

        // Modificar Ciclo de Vida del Socio
        const now = new Date();
        const currentEnd = member.currentPeriodEnd || now;

        // Determinar nueva fecha (mensual o anual)
        const nextDate = new Date(Math.max(now.getTime(), currentEnd.getTime()));
        if (plan.billingCycle === 'YEARLY') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }

        await prisma.member.update({
            where: { id: member.id, tenantId },
            data: {
                subscriptionStatus: 'ACTIVE',
                currentPeriodEnd: nextDate
            }
        });

        return { success: true, paymentId: payment.id };

    } catch (e) {
        console.error("Error creating membership payment", e);
        return { success: false, error: 'Error interno de facturación.' };
    }
}
