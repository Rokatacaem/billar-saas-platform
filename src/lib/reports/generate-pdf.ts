/**
 * 📄 SCRIBE: Generador de PDF Client-Side para Z-Report
 * Usa jsPDF (browser) para producir dos formatos:
 *   - TICKET: 80mm (ticketera térmica Epson/Star)
 *   - A4:     Reporte Ejecutivo con gráfico de barras
 */

import { jsPDF } from 'jspdf';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ZReportData {
    id: string;
    date: string;
    closedBy: string;
    notes?: string | null;
    status: string;
    // Revenue
    totalRevenue: number;
    timeRevenue: number;
    productRevenue: number;
    membershipRevenue: number;
    rentalRevenue: number;
    // Payments
    cashRevenue: number;
    cardRevenue: number;
    creditRevenue: number;
    // Costs
    totalCost: number;
    wasteCost: number;
    maintenanceCost: number;
    netProfit: number;
    // Audit
    cashInHand: number | null;
    cashDifference: number | null;
    hasCashAlert: boolean;
    sessionCount: number;
    // Integrity
    integrityHash?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// ─── FORMATO TICKET TÉRMICO (80mm = 226 unidades PDF) ────────────────────────
export function downloadTicketPDF(data: ZReportData, tenantName: string) {
    // jsPDF unidades: 'mm'. Ticketera 80mm de ancho, largo dinámico
    const W = 72; // margen interno 4mm a cada lado
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });

    let y = 6;
    const line = () => { doc.line(4, y, 76, y); y += 3; };
    const bold = (s: string, size = 9) => { doc.setFont('courier', 'bold'); doc.setFontSize(size); };
    const normal = (s: string, size = 8) => { doc.setFont('courier', 'normal'); doc.setFontSize(size); };
    const center = (s: string, yy?: number) => doc.text(s, 40, yy ?? y, { align: 'center' });
    const two = (l: string, r: string) => {
        doc.setFontSize(8);
        doc.text(l, 5, y);
        doc.text(r, 75, y, { align: 'right' });
        y += 4;
    };

    // Header
    bold(''); doc.setFontSize(11);
    center(`*** ${tenantName.toUpperCase()} ***`); y += 5;
    normal(''); doc.setFontSize(8);
    center('CIERRE DE TURNO — Z Report'); y += 4;
    center(fmtDate(data.date)); y += 4;
    center(`Cajero: ${data.closedBy}`); y += 4;
    center(`Sesiones: ${data.sessionCount}`); y += 3;
    line();

    // Revenue
    bold(''); doc.setFontSize(8);
    doc.text('INGRESOS', 5, y); y += 5;
    normal('');
    two('Tiempo de Juego', fmt(data.timeRevenue));
    two('Bar / Cocina', fmt(data.productRevenue));
    two('Cuotas Sociales', fmt(data.membershipRevenue));
    two('Arriendos', fmt(data.rentalRevenue));
    bold(''); two('TOTAL INGRESOS', fmt(data.totalRevenue));
    line();

    // Payments
    normal(''); doc.setFontSize(8);
    doc.text('CONCILIACION DE PAGOS', 5, y); y += 5;
    two('Efectivo (teorico)', fmt(data.cashRevenue));
    two('Tarjeta / Digital', fmt(data.cardRevenue));
    two('Credito / Cuenta', fmt(data.creditRevenue));
    line();

    // Arqueo Ciego
    doc.text('ARQUEO CIEGO', 5, y); y += 5;
    two('Efectivo declarado', fmt(data.cashInHand ?? 0));
    two('Efectivo teorico', fmt(data.cashRevenue));
    bold('');
    if (data.hasCashAlert) {
        doc.setTextColor(180, 0, 0);
        two('** DESCUADRE **', fmt(Math.abs(data.cashDifference ?? 0)));
        doc.setTextColor(0, 0, 0);
    } else {
        two('Diferencia', fmt(Math.abs(data.cashDifference ?? 0)));
    }
    normal(''); line();

    // Costs
    doc.text('EGRESOS', 5, y); y += 5;
    two('COGS Insumos', fmt(data.totalCost));
    two('Mermas', fmt(data.wasteCost));
    two('Mantenimiento', fmt(data.maintenanceCost));
    line();

    // Net
    bold(''); doc.setFontSize(10);
    if (data.netProfit >= 0) doc.setTextColor(0, 120, 80);
    else doc.setTextColor(180, 0, 0);
    center(`UTILIDAD NETA: ${fmt(data.netProfit)}`); y += 6;
    doc.setTextColor(0, 0, 0);
    line();

    // Notas
    if (data.notes) {
        normal(''); doc.setFontSize(7);
        doc.text(`Nota: ${data.notes}`, 5, y, { maxWidth: 70 }); y += 8;
        line();
    }

    // Sello Sentinel
    normal(''); doc.setFontSize(6);
    center('--- SENTINEL INTEGRITY SEAL ---'); y += 4;
    if (data.integrityHash) {
        const half = data.integrityHash.length / 2;
        center(data.integrityHash.slice(0, half)); y += 3;
        center(data.integrityHash.slice(half)); y += 3;
    }
    center(`Sellado: ${new Date().toISOString()}`); y += 4;
    center('*** FIN DE REPORTE ***'); y += 4;

    doc.save(`z-report-ticket-${data.id.slice(-8)}.pdf`);
}

// ─── FORMATO REPORTE EJECUTIVO (A4) ──────────────────────────────────────────
export function downloadExecutivePDF(data: ZReportData, tenantName: string) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW = 210; // A4 width
    const ML = 20; // margin left
    const MR = 190; // margin right
    let y = 0;

    // ── Fondo header ──
    doc.setFillColor(17, 24, 39); // gray-900
    doc.rect(0, 0, PW, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Z-Report · Cierre de Turno', ML, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(`${tenantName} — ${fmtDate(data.date)}`, ML, 26);
    doc.text(`Cajero: ${data.closedBy} · ${data.sessionCount} sesiones · ID: ${data.id.slice(-8)}`, ML, 33);
    doc.setTextColor(0, 0, 0);
    y = 54;

    // ── Alerta Sentinel (si aplica) ──
    if (data.hasCashAlert) {
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(239, 68, 68);
        doc.roundedRect(ML, y, MR - ML, 14, 2, 2, 'FD');
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`🚩 ALERTA SENTINEL: Descuadre de ${fmt(Math.abs(data.cashDifference ?? 0))} · Teórico: ${fmt(data.cashRevenue)} · Declarado: ${fmt(data.cashInHand ?? 0)}`, ML + 4, y + 9);
        doc.setTextColor(0, 0, 0);
        y += 20;
    } else {
        doc.setFillColor(209, 250, 229);
        doc.setDrawColor(52, 211, 153);
        doc.roundedRect(ML, y, MR - ML, 10, 2, 2, 'FD');
        doc.setTextColor(6, 95, 70);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('✅  Arqueo Ciego Cuadrado — Sin anomalías', ML + 4, y + 7);
        doc.setTextColor(0, 0, 0);
        y += 16;
    }

    // ── Tabla helper ──
    const tableHeader = (title: string) => {
        doc.setFillColor(243, 244, 246);
        doc.rect(ML, y, MR - ML, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(title.toUpperCase(), ML + 3, y + 5);
        doc.setTextColor(0, 0, 0);
        y += 10;
    };

    const tableRow = (label: string, value: string, isTotal = false, valueColor?: [number, number, number]) => {
        if (isTotal) {
            doc.setFillColor(249, 250, 251);
            doc.rect(ML, y - 1, MR - ML, 8, 'F');
            doc.setFont('helvetica', 'bold');
        } else {
            doc.setFont('helvetica', 'normal');
        }
        doc.setFontSize(9);
        doc.text(label, ML + 3, y + 4);
        if (valueColor) doc.setTextColor(...valueColor);
        doc.text(value, MR - 3, y + 4, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(243, 244, 246);
        doc.line(ML, y + 7, MR, y + 7);
        y += 8;
    };

    // ── Revenue Streams ──
    tableHeader('Revenue Streams');
    tableRow('Tiempo de Juego', fmt(data.timeRevenue));
    tableRow('Bar / Cocina', fmt(data.productRevenue));
    tableRow('Cuotas Sociales', fmt(data.membershipRevenue));
    tableRow('Arriendos', fmt(data.rentalRevenue));
    tableRow('TOTAL INGRESOS', fmt(data.totalRevenue), true);
    y += 4;

    // ── Gráfico de Barras (simple, proporcional) ──
    const CHART_X = ML;
    const CHART_W = (MR - ML);
    const CHART_H = 24;
    const BAR_H = 7;
    const maxVal = Math.max(data.totalRevenue, data.totalCost + data.wasteCost + data.maintenanceCost, 1);

    doc.setFillColor(229, 231, 235);
    doc.rect(CHART_X, y, CHART_W, CHART_H, 'F');

    // Barra Ingresos (verde)
    doc.setFillColor(16, 185, 129);
    doc.rect(CHART_X + 2, y + 2, (data.totalRevenue / maxVal) * (CHART_W - 4), BAR_H, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text(`Ingresos ${fmt(data.totalRevenue)}`, CHART_X + 4, y + 7.5);

    // Barra Egresos (ámbar)
    const totalCosts = data.totalCost + data.wasteCost + data.maintenanceCost;
    doc.setFillColor(245, 158, 11);
    doc.rect(CHART_X + 2, y + 12, (totalCosts / maxVal) * (CHART_W - 4), BAR_H, 'F');
    doc.text(`Egresos ${fmt(totalCosts)}`, CHART_X + 4, y + 17.5);

    doc.setTextColor(0, 0, 0);
    y += CHART_H + 6;

    // ── Conciliación de Pagos ──
    tableHeader('Conciliación de Pagos');
    tableRow('💵  Efectivo (Teórico)', fmt(data.cashRevenue));
    tableRow('💳  Tarjeta / Digital', fmt(data.cardRevenue));
    tableRow('📒  Crédito / Cuenta Corriente', fmt(data.creditRevenue));
    tableRow('Efectivo Declarado (Cajero)', fmt(data.cashInHand ?? 0));
    tableRow(
        'Diferencia (Arqueo Ciego)',
        fmt(data.cashDifference ?? 0),
        true,
        data.hasCashAlert ? [185, 28, 28] : [5, 150, 105]
    );
    y += 4;

    // ── Egresos y Utilidad ──
    tableHeader('Egresos y Utilidad Neta');
    tableRow('COGS (Costo de Insumos)', fmt(data.totalCost));
    tableRow('Mermas Registradas', fmt(data.wasteCost));
    tableRow('Gastos de Mantenimiento', fmt(data.maintenanceCost));
    y += 2;

    // Caja de Utilidad Neta
    const profitColor: [number, number, number] = data.netProfit >= 0 ? [5, 150, 105] : [185, 28, 28];
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(ML, y, MR - ML, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('UTILIDAD NETA DEL TURNO', ML + 6, y + 7);
    doc.setTextColor(...profitColor);
    doc.setFontSize(14);
    doc.text(fmt(data.netProfit), MR - 6, y + 10, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const margin = ((data.netProfit / (data.totalRevenue || 1)) * 100).toFixed(1);
    doc.text(`Margen: ${margin}%`, MR - 6, y + 14, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 24;

    // ── Notas ──
    if (data.notes) {
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(209, 213, 219);
        doc.roundedRect(ML, y, MR - ML, 14, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(107, 114, 128);
        doc.text('NOTAS DEL CAJERO', ML + 3, y + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(55, 65, 81);
        doc.text(data.notes, ML + 3, y + 11, { maxWidth: MR - ML - 6 });
        y += 18;
    }

    // ── Footer: Sello de Integridad ──
    const footerY = 270;
    doc.setFillColor(31, 41, 55);
    doc.rect(0, footerY, PW, 27, 'F');
    doc.setTextColor(156, 163, 175);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('🔐 SENTINEL INTEGRITY SEAL — SHA-256', ML, footerY + 6);
    if (data.integrityHash) {
        doc.text(data.integrityHash, ML, footerY + 11);
    }
    doc.text(`Sellado: ${new Date().toISOString()} · Documento inmutable · Billar SaaS Platform`, ML, footerY + 16);
    doc.setTextColor(75, 85, 99);
    doc.text('Si los datos de este reporte son alterados, el hash no coincidirá con el registrado en Sentinel SystemLog.', ML, footerY + 21);

    doc.save(`z-report-ejecutivo-${data.id.slice(-8)}.pdf`);
}
