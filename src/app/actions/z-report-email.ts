'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Resend } from 'resend';
import { generateIntegritySeal, saveIntegritySeal } from '@/lib/reports/integrity-seal';

const resend = new Resend(process.env.RESEND_API_KEY);

const fmt = (n: number, currency = '$') =>
  `${currency}${Math.round(n).toLocaleString('es-CL')}`;

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/**
 * 📧 SCRIBE: Envía el Z-Report por email al administrador del tenant.
 * Genera el sello de integridad SHA-256 antes de enviarlo.
 */
export async function sendZReportEmail(balanceId: string) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const tenantId = session.user.tenantId;

  // 1. Recuperar el balance completo
  const balance = await prisma.dailyBalance.findUnique({
    where: { id: balanceId, tenantId },
    include: { _count: { select: { usageLogs: true } } },
  });

  if (!balance) return { success: false, error: 'Balance no encontrado' };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { success: false, error: 'Tenant no encontrado' };

  // 2. Generar y guardar sello de integridad
  const seal = generateIntegritySeal({
    balanceId: balance.id,
    totalRevenue: balance.totalRevenue,
    netProfit: balance.netProfit,
    closedBy: balance.closedBy,
    cashInHand: balance.cashInHand,
    cashDifference: balance.cashDifference,
    date: balance.date,
  });
  await saveIntegritySeal(tenantId, balanceId, seal);

  // 3. Construir el cuerpo del email
  const alertBanner = balance.hasCashAlert
    ? `<div style="background:#fee2e2;border:2px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;font-weight:800;color:#b91c1c;font-size:15px;">🚩 ALERTA DE DESCUADRE DE CAJA</p>
            <p style="margin:4px 0 0;color:#dc2626;font-size:13px;">
              ${(balance.cashDifference ?? 0) > 0 ? 'Sobran' : 'Faltan'} 
              ${fmt(Math.abs(balance.cashDifference ?? 0))} · 
              Teórico: ${fmt(balance.cashRevenue)} · Declarado: ${fmt(balance.cashInHand ?? 0)}
            </p>
           </div>`
    : `<div style="background:#d1fae5;border:1px solid #34d399;border-radius:8px;padding:12px;margin:16px 0;">
            <p style="margin:0;color:#065f46;font-weight:600;font-size:13px;">✅ Caja Cuadrada — Sin anomalías</p>
           </div>`;

  const row = (label: string, value: string, bold = false) =>
    `<tr>
            <td style="padding:8px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">${label}</td>
            <td style="padding:8px 16px;text-align:right;font-size:13px;font-weight:${bold ? '800' : '400'};color:${bold ? '#111827' : '#374151'};border-bottom:1px solid #f3f4f6;">${value}</td>
         </tr>`;

  const profitColor = balance.netProfit >= 0 ? '#059669' : '#dc2626';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- Header -->
  <div style="background:${tenant.primaryColor || '#111827'};padding:28px 32px;display:flex;align-items:center;gap:16px;">
    ${tenant.logoUrl ? `<img src="${tenant.logoUrl}" alt="${tenant.name}" style="height:48px;border-radius:8px;" />` : ''}
    <div>
      <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;">WOR Billiard Systems</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:900;">🔒 Z-Report · Cierre de Turno</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">${tenant.name} — ${fmtDate(balance.date)}</p>
    </div>
  </div>

  <!-- Alert -->
  <div style="padding:0 32px;">${alertBanner}</div>

  <!-- Revenue Streams -->
  <div style="padding:0 32px 16px;">
    <p style="font-size:10px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;">Revenue Streams</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f3f4f6;">
      ${row('Tiempo de Juego', fmt(balance.timeRevenue))}
      ${row('Bar / Cocina', fmt(balance.productRevenue))}
      ${row('Cuotas Sociales', fmt(balance.membershipRevenue))}
      ${row('Arriendos', fmt(balance.rentalRevenue))}
      ${row('TOTAL INGRESOS', fmt(balance.totalRevenue), true)}
    </table>
  </div>

  <!-- Conciliacion de Pagos -->
  <div style="padding:0 32px 16px;">
    <p style="font-size:10px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;">Conciliación de Pagos</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f3f4f6;">
      ${row('💵 Efectivo (Teórico)', fmt(balance.cashRevenue))}
      ${row('💳 Tarjeta / Digital', fmt(balance.cardRevenue))}
      ${row('📒 Crédito / Cuenta Corriente', fmt(balance.creditRevenue))}
    </table>
  </div>

  <!-- Bottom Line -->
  <div style="padding:0 32px 16px;">
    <p style="font-size:10px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin:16px 0 8px;">Egresos y Utilidad Neta</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f3f4f6;">
      ${row('COGS (Costo de Insumos)', fmt(balance.totalCost))}
      ${row('Mermas Registradas', fmt(balance.wasteCost))}
      ${row('Gastos de Mantenimiento', fmt(balance.maintenanceCost))}
    </table>
    <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-weight:900;font-size:13px;color:#111827;text-transform:uppercase;letter-spacing:1px;">Utilidad Neta</span>
      <span style="font-weight:900;font-size:22px;color:${profitColor};">${fmt(balance.netProfit)}</span>
    </div>
  </div>

  <!-- Meta -->
  <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
    <p style="margin:0;color:#9ca3af;font-size:11px;">Cerrado por <strong style="color:#374151;">${balance.closedBy}</strong> · ${balance._count.usageLogs} sesiones consolidadas</p>
    ${balance.notes ? `<p style="margin:4px 0 0;color:#6b7280;font-size:12px;font-style:italic;">"${balance.notes}"</p>` : ''}
  </div>

  <!-- Sello de Integridad -->
  <div style="padding:16px 32px;background:#1f2937;border-top:1px solid #374151;">
    <p style="margin:0;color:#6b7280;font-size:10px;font-family:monospace;letter-spacing:0.5px;">
      🔐 SENTINEL INTEGRITY SEAL · SHA-256<br>
      ${seal.hash}<br>
      Sellado: ${seal.timestamp}
    </p>
  </div>

</div>
</body></html>`;

  // 4. Enviar email
  const ownerEmail = process.env.OWNER_EMAIL || 'rodrigo@billarsaas.com';
  try {
    await resend.emails.send({
      from: 'Sentinel <alerts@billarsaas.com>',
      to: [ownerEmail],
      subject: `📊 Z-Report ${tenant.name} — ${fmtDate(balance.date)}${balance.hasCashAlert ? ' 🚩 DESCUADRE' : ''}`,
      html,
    });
    return { success: true, sealHash: seal.hash };
  } catch (err) {
    console.error('[Z-Report Email]', err);
    return { success: false, error: 'Error al enviar el email' };
  }
}
