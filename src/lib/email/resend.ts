import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
    }>;
}

/**
 * Send email via Resend
 */
export async function sendEmail(options: EmailOptions) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Billar SaaS <noreply@billar-saas.com>', // Update with your verified domain
            to: options.to,
            subject: options.subject,
            html: options.html,
            attachments: options.attachments
        });

        if (error) {
            throw new Error(error.message);
        }

        return { success: true, data };
    } catch (error) {
        console.error('[Resend] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Email send failed'
        };
    }
}

/**
 * Generate branded email template for weekly report
 */
export function getWeeklyReportEmailTemplate(tenant: {
    name: string;
    primaryColor: string;
    logoUrl?: string | null;
}, period: string): string {
    const logo = tenant.logoUrl
        ? `<img src="${tenant.logoUrl}" alt="${tenant.name}" style="max-width: 200px; height: auto;" />`
        : `<h1 style="color: ${tenant.primaryColor};">${tenant.name}</h1>`;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: ${tenant.primaryColor}; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                ${logo}
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: ${tenant.primaryColor}; margin-top: 0;">📊 Reporte Ejecutivo Semanal</h2>
                
                <p style="font-size: 16px;">
                    Adjunto encontrarás el reporte ejecutivo de <strong>${tenant.name}</strong> correspondiente al período <strong>${period}</strong>.
                </p>
                
                <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid ${tenant.primaryColor}; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">
                        Este reporte incluye métricas clave de tu negocio, tendencias de rendimiento, y recomendaciones automatizadas para optimizar tus operaciones.
                    </p>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                    Si tienes alguna pregunta sobre este reporte, no dudes en contactarnos.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    © 2026 Billar SaaS Platform. Este reporte se genera automáticamente cada lunes.
                </p>
            </div>
        </body>
        </html>
    `;
}
