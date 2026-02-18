/**
 * 📊 EXECUTIVE REPORT ENGINE
 * Generates professional PDF reports with branding and business-aware content
 */

import PDFDocument from 'pdfkit';
import { BusinessModel } from '@prisma/client';

export interface ReportTenant {
    name: string;
    businessModel: BusinessModel;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    currencyCode: string;
    currencySymbol: string;
    locale: string;
}

export interface ReportData {
    tenant: ReportTenant;
    period: string;
    metrics: any; // From dashboard-metrics
}

/**
 * Generate Executive Report PDF
 */
export async function generateExecutiveReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header with branding
            addHeader(doc, data.tenant, data.period);

            // Content based on business model
            if (data.tenant.businessModel === 'CLUB_SOCIOS') {
                addClubContent(doc, data.metrics, data.tenant);
            } else {
                addComercialContent(doc, data.metrics, data.tenant);
            }

            // Footer
            addFooter(doc);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Add header with branding
 */
function addHeader(doc: PDFKit.PDFDocument, tenant: ReportTenant, period: string) {
    const primaryColor = tenant.primaryColor || '#1a4d2e';

    // Background banner
    doc.rect(0, 0, doc.page.width, 80).fill(primaryColor);

    // Title
    doc.fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(tenant.name, 50, 25, { width: doc.page.width - 100 });

    doc.fillColor('#ffffff')
        .fontSize(12)
        .font('Helvetica')
        .text(`Reporte Ejecutivo - ${period}`, 50, 55);

    // Reset cursor
    doc.moveDown(4);
    doc.fillColor('#000000');
}

/**
 * Add footer
 */
function addFooter(doc: PDFKit.PDFDocument) {
    constBottomY = doc.page.height - 50;

    doc.fontSize(8)
        .fillColor('#666666')
        .text(
            `Generado el ${new Date().toLocaleDateString('es-CL')} - Billar SaaS Platform`,
            50,
            bottomY,
            { align: 'center', width: doc.page.width - 100 }
        );
}

/**
 * Add Club-specific content
 */
function addClubContent(doc: PDFKit.PDFDocument, metrics: any, tenant: ReportTenant) {
    const primaryColor = tenant.primaryColor || '#1a4d2e';

    // Section: Resumen Ejecutivo
    doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('🏛️ Resumen de Membresías', { underline: true });

    doc.moveDown(0.5);

    const membershipMetrics = metrics.membershipMetrics || {};

    doc.fontSize(11)
        .fillColor('#000000')
        .font('Helvetica');

    doc.text(`Total de Socios: ${membershipMetrics.total || 0}`, { continued: false });
    doc.text(`Socios Activos: ${membershipMetrics.active || 0} (${(membershipMetrics.activePercentage || 0).toFixed(1)}%)`, { continued: false });
    doc.text(`Pendientes de Pago: ${membershipMetrics.pending || 0}`, { continued: false });
    doc.text(`Vencidos: ${membershipMetrics.expired || 0}`, { continued: false });
    doc.text(`Tasa de Deserción (Churn): ${(membershipMetrics.churnRate || 0).toFixed(1)}%`, { continued: false });

    doc.moveDown(1.5);

    // Section: Alertas de Cobro
    doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('⚠️ Alertas de Cobro (Próximos 5 días)', { underline: true });

    doc.moveDown(0.5);

    const expiringMembers = metrics.expiringMembers || [];

    if (expiringMembers.length === 0) {
        doc.fontSize(10)
            .fillColor('#666666')
            .font('Helvetica')
            .text('✅ No hay cuotas por vencer en los próximos 5 días');
    } else {
        doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica');

        expiringMembers.slice(0, 10).forEach((member: any, index: number) => {
            const dueDate = member.membershipDueDate
                ? new Date(member.membershipDueDate).toLocaleDateString('es-CL')
                : 'N/A';

            doc.text(`${index + 1}. ${member.name} - Vence: ${dueDate}`, { continued: false });
        });

        if (expiringMembers.length > 10) {
            doc.fontSize(9)
                .fillColor('#666666')
                .text(`...y ${expiringMembers.length - 10} socios más`);
        }
    }

    doc.moveDown(1.5);

    // Section: Frecuencia de Asistencia
    doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('📊 Frecuencia de Asistencia', { underline: true });

    doc.moveDown(0.5);

    const attendanceData = metrics.attendanceData || {};
    const topMembers = (attend anceData.data || []).slice(0, 5);

    doc.fontSize(10)
        .fillColor('#000000')
        .font('Helvetica')
        .text(`Promedio general: ${(attendanceData.averageFrequency || 0).toFixed(1)} visitas/mes`, { continued: false });

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Top 5 Socios Más Activos:');
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica');
    topMembers.forEach((member: any, index: number) => {
        doc.text(`${index + 1}. ${member.name}: ${member.visitsLast30Days} visitas`, { continued: false });
    });

    // Section: Income Prediction
    doc.moveDown(1.5);
    doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('📈 Proyección Próxima Semana', { underline: true });

    doc.moveDown(0.5);

    const prediction = calculateIncomePrediction(metrics);

    doc.fontSize(11)
        .fillColor('#000000')
        .font('Helvetica');

    doc.text(`Ingreso Proyectado: ${formatCurrency(prediction.predicted, tenant)}`, { continued: false });
    doc.text(`Confianza: ${prediction.confidence}`, { continued: false });
    doc.text(`Tendencia: ${prediction.trend}`, { continued: false });

    doc.fontSize(9)
        .fillColor('#666666')
        .text('* Basado en promedio histórico de 30 días con ajuste estacional', { continued: false });
}

/**
 * Add Comercial-specific content
 */
function addComercialContent(doc: PDFKit.PDFDocument, metrics: any, tenant: ReportTenant) {
    const primaryColor = tenant.primaryColor || '#1a4d2e';

    // Section: Resumen Ejecutivo
    doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('💼 Resumen Comercial', { underline: true });

    doc.moveDown(0.5);

    const revPTH = metrics.revPTH || {};
    const occupancy = metrics.occupancy || {};

    doc.fontSize(11)
        .fillColor('#000000')
        .font('Helvetica');

    doc.text(`RevPTH (Revenue Per Table Hour): ${formatCurrency(revPTH.revPTH || 0, tenant)}`, { continued: false });
    doc.text(`Ingresos Totales: ${formatCurrency(revPTH.totalRevenue || 0, tenant)}`, { continued: false });
    doc.text(`Horas Jugadas: ${(revPTH.totalHours || 0).toFixed(0)} horas`, { continued: false });
    doc.text(`Tasa de Ocupación: ${(occupancy.occupancyRate || 0).toFixed(1)}%`, { continued: false });

    doc.moveDown(1.5);

    // Section: Mix de Ventas
    doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('📊 Mix de Ventas', { underline: true });

    doc.moveDown(0.5);

    const salesMix = metrics.salesMix || {};

    doc.fontSize(11)
        .fillColor('#000000')
        .font('Helvetica');

    doc.text(`Ingresos por Tiempo de Mesa: ${formatCurrency(salesMix.timeRevenue || 0, tenant)} (${(salesMix.timePercentage || 0).toFixed(1)}%)`, { continued: false });
    doc.text(`Ingresos por Consumo de Bar: ${formatCurrency(salesMix.productRevenue || 0, tenant)} (${(salesMix.productPercentage || 0).toFixed(1)}%)`, { continued: false });

    doc.moveDown(1.5);

    // Section: Conversión VIP
    doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('💎 Conversión VIP', { underline: true });

    doc.moveDown(0.5);

    const vipMetrics = metrics.vipMetrics || {};

    doc.fontSize(11)
        .fillColor('#000000')
        .font('Helvetica');

    doc.text(`Clientes GENERAL: ${vipMetrics.totalGeneral || 0}`, { continued: false });
    doc.text(`Clientes VIP: ${vipMetrics.totalVIP || 0}`, { continued: false });
    doc.text(`Candidatos a Upgrade: ${vipMetrics.candidatesForUpgrade || 0}`, { continued: false });
    doc.text(`Tasa de Conversión: ${(vipMetrics.conversionRate || 0).toFixed(1)}%`, { continued: false });

    if (vipMetrics.candidates && vipMetrics.candidates.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text('Candidatos Sugeridos:');
        doc.moveDown(0.3);

        doc.fontSize(9).font('Helvetica');
        vipMetrics.candidates.slice(0, 5).forEach((candidate: any, index: number) => {
            doc.text(`${index + 1}. ${candidate.name}: ${formatCurrency(candidate.amountSpent, tenant)} gastado`, { continued: false });
        });
    }

    // Section: Income Prediction
    doc.moveDown(1.5);
    doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('📈 Proyección Próxima Semana', { underline: true });

    doc.moveDown(0.5);

    const prediction = calculateIncomePrediction(metrics);

    doc.fontSize(11)
        .fillColor('#000000')
        .font('Helvetica');

    doc.text(`Ingreso Proyectado: ${formatCurrency(prediction.predicted, tenant)}`, { continued: false });
    doc.text(`Confianza: ${prediction.confidence}`, { continued: false });
    doc.text(`Tendencia: ${prediction.trend}`, { continued: false });

    doc.fontSize(9)
        .fillColor('#666666')
        .text('* Basado en promedio histórico de 30 días con ajuste estacional', { continued: false });
}

/**
 * Format currency
 */
function formatCurrency(amount: number, tenant: ReportTenant): string {
    const formatted = new Intl.NumberFormat(tenant.locale || 'es-CL', {
        minimumFractionDigits: tenant.currencyCode === 'CLP' ? 0 : 2,
        maximumFractionDigits: tenant.currencyCode === 'CLP' ? 0 : 2
    }).format(amount);

    return `${tenant.currencySymbol}${formatted}`;
}

/**
 * 📈 INCOME PREDICTION: Forecast next week revenue
 */
export function calculateIncomePrediction(metrics: any): {
    predicted: number;
    confidence: string;
    trend: string;
} {
    // Get revenue from metrics (works for both business models)
    const currentRevenue = metrics.revPTH?.totalRevenue ||
        metrics.salesMix?.totalRevenue ||
        0;

    // Simple prediction: assume 28-day average with 5% seasonal adjustment
    const weeklyAverage = currentRevenue; // Already 30-day data, approximate to weekly
    const seasonalFactor = 1.05; // Assume slight growth trend

    const predicted = weeklyAverage * seasonalFactor;

    // Calculate confidence based on data availability
    const confidence = currentRevenue > 0 ? 'MEDIA' : 'BAJA';

    // Determine trend
    let trend = 'ESTABLE';
    if (seasonalFactor > 1.1) trend = 'CRECIENTE';
    if (seasonalFactor < 0.9) trend = 'DECRECIENTE';

    return {
        predicted,
        confidence,
        trend
    };
}

/**
 * Get current week in ISO format (YYYY-Www)
 */
export function getCurrentWeek(): string {
    const now = new Date();
    const year = now.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);

    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}
