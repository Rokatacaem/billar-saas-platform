'use server';

import { Resend } from 'resend';
import { logSecurityEvent, ThreatLevel } from '@/lib/security/intrusion-detector';
import { validateEmailDomain } from '@/lib/security/lead-validator';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía email de bienvenida a nuevo lead
 */
export async function sendWelcomeEmail(
    leadEmail: string,
    leadName: string,
    country: string,
    currency: string
) {
    // 🛡️ SECURITY: Validar dominio antes de enviar
    const domainValidation = validateEmailDomain(leadEmail);

    if (!domainValidation.valid) {
        await logSecurityEvent({
            type: 'EMAIL_DOMAIN_REJECTED',
            severity: ThreatLevel.MEDIUM,
            message: `Rejected email from temporary/suspicious domain: ${leadEmail}`,
            details: { email: leadEmail, reason: domainValidation.reason }
        });

        return { success: false, error: 'Invalid email domain' };
    }

    try {
        // Determinar idioma por país
        const language = getLanguageByCountry(country);

        const emailSubject = language === 'es'
            ? `¡Bienvenido ${leadName}! 🎱 Tu Demo de Billar SaaS Platform`
            : `Welcome ${leadName}! 🎱 Your Billar SaaS Platform Demo`;

        const emailHtml = generateWelcomeEmailHTML(leadName, country, currency, language);

        await resend.emails.send({
            from: 'Billar SaaS Platform <onboarding@billarsaas.com>',
            to: [leadEmail],
            subject: emailSubject,
            html: emailHtml,
            // TODO: Adjuntar Media Kit PDF cuando esté disponible
            // attachments: [{
            //     filename: 'Billar-SaaS-Media-Kit.pdf',
            //     path: './public/media-kit.pdf'
            // }]
        });

        // Log éxito
        await logSecurityEvent({
            type: 'WELCOME_EMAIL_SENT',
            severity: ThreatLevel.LOW,
            message: `Welcome email sent to ${leadEmail} (${country})`,
            details: { email: leadEmail, country, language }
        });

        return { success: true };

    } catch (error: any) {
        console.error('Error sending welcome email:', error);

        await logSecurityEvent({
            type: 'EMAIL_SEND_FAILED',
            severity: ThreatLevel.MEDIUM,
            message: `Failed to send welcome email to ${leadEmail}`,
            details: { error: error.message }
        });

        return { success: false, error: 'Failed to send email' };
    }
}

/**
 * Envía notificación a Rodrigo sobre lead de alta prioridad
 */
export async function notifyOwnerHighPriorityLead(
    leadEmail: string,
    leadName: string,
    country: string,
    reason: string
) {
    try {
        const ownerEmail = process.env.OWNER_EMAIL || 'rodrigo@billarsaas.com';

        await resend.emails.send({
            from: 'Sentinel <alerts@billarsaas.com>',
            to: [ownerEmail],
            subject: `🚨 Lead de Alta Prioridad: ${leadName} (${country})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a4d2e;">🎯 Nuevo Lead de Alta Prioridad</h2>
                    
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
                        <p><strong>Nombre:</strong> ${leadName}</p>
                        <p><strong>Email:</strong> ${leadEmail}</p>
                        <p><strong>País:</strong> ${country}</p>
                        <p><strong>Razón de Prioridad:</strong> ${reason}</p>
                    </div>

                    <p style="color: #666;">
                        Este lead ha sido clasificado como alta prioridad por Sentinel.
                        Te recomendamos contactarlo dentro de las próximas 24 horas.
                    </p>

                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/leads" 
                       style="display: inline-block; padding: 1rem 2rem; background: #1a4d2e; color: white; text-decoration: none; border-radius: 8px; margin-top: 1rem;">
                        Ver en Dashboard
                    </a>
                </div>
            `
        });

        await logSecurityEvent({
            type: 'OWNER_NOTIFIED_HIGH_PRIORITY',
            severity: ThreatLevel.LOW,
            message: `Owner notified about high-priority lead: ${leadEmail}`,
            details: { leadEmail, country, reason }
        });

        return { success: true };

    } catch (error) {
        console.error('Error notifying owner:', error);
        return { success: false };
    }
}

/**
 * Determina idioma por país
 */
function getLanguageByCountry(country: string): 'es' | 'en' {
    const spanishCountries = [
        'Chile', 'Mexico', 'Argentina', 'Peru', 'Colombia',
        'Spain', 'España', 'Venezuela', 'Ecuador', 'Uruguay'
    ];

    return spanishCountries.includes(country) ? 'es' : 'en';
}

/**
 * Genera HTML del email de bienvenida
 */
function generateWelcomeEmailHTML(
    name: string,
    country: string,
    currency: string,
    language: 'es' | 'en'
): string {
    if (language === 'es') {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5;">
                <div style="max-width: 600px; margin: 2rem auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1a4d2e 0%, #2d7a50 100%); padding: 2rem; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 2rem;">🎱 ¡Bienvenido, ${name}!</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0 0;">
                            Gracias por tu interés en Billar SaaS Platform
                        </p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 2rem;">
                        <p style="color: #333; font-size: 1.1rem; line-height: 1.6;">
                            Hola <strong>${name}</strong> desde ${country},
                        </p>

                        <p style="color: #666; line-height: 1.6;">
                            Detectamos que estás interesado en transformar la gestión de tu club de billar pool.
                            Estás en el lugar correcto.
                        </p>

                        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                            <h3 style="color: #1a4d2e; margin-top: 0;">🚀 ¿Qué incluye Billar SaaS Platform?</h3>
                            <ul style="color: #666; line-height: 1.8;">
                                <li>Control de Mesas en tiempo real con facturación automática</li>
                                <li>TPV & Bar integrado con gestión de inventario</li>
                                <li>BI & Analytics: dashboards de rentabilidad</li>
                                <li>Portal QR para que tus socios pidan desde la mesa</li>
                                <li>Multi-moneda (opera en ${currency} o cualquier divisa)</li>
                            </ul>
                        </div>

                        <h3 style="color: #1a4d2e;">📊 Próximos Pasos</h3>
                        <ol style="color: #666; line-height: 1.8;">
                            <li>Explora nuestra <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/demo/tables" style="color: #1a4d2e;">demo en vivo</a></li>
                            <li>Agenda una llamada para ver el sistema en acción</li>
                            <li>Recibe tu propuesta personalizada para ${country}</li>
                        </ol>

                        <div style="text-align: center; margin: 2rem 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/demo/tables" 
                               style="display: inline-block; padding: 1rem 2.5rem; background: #1a4d2e; color: white; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 1.1rem;">
                                🎮 Ver Demo en Vivo
                            </a>
                        </div>

                        <p style="color: #999; font-size: 0.9rem; border-top: 1px solid #eee; padding-top: 1rem; margin-top: 2rem;">
                            Cualquier pregunta, simplemente responde este correo. Estamos aquí para ayudarte.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background: #f8f9fa; padding: 1.5rem; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="color: #999; font-size: 0.85rem; margin: 0;">
                            © 2026 Billar SaaS Platform • La infraestructura del billar pool
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    } else {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5;">
                <div style="max-width: 600px; margin: 2rem auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1a4d2e 0%, #2d7a50 100%); padding: 2rem; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 2rem;">🎱 Welcome, ${name}!</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0 0;">
                            Thank you for your interest in Billar SaaS Platform
                        </p>
                    </div>

                    <!-- Body -->
                    <div style="padding: 2rem;">
                        <p style="color: #333; font-size: 1.1rem; line-height: 1.6;">
                            Hello <strong>${name}</strong> from ${country},
                        </p>

                        <p style="color: #666; line-height: 1.6;">
                            We detected you're interested in transforming your pool hall management.
                            You're in the right place.
                        </p>

                        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                            <h3 style="color: #1a4d2e; margin-top: 0;">🚀 What's included in Billar SaaS Platform?</h3>
                            <ul style="color: #666; line-height: 1.8;">
                                <li>Real-time Table Management with automatic billing</li>
                                <li>Integrated POS & Bar with inventory management</li>
                                <li>BI & Analytics: profitability dashboards</li>
                                <li>QR Portal for members to order from tables</li>
                                <li>Multi-currency (operate in ${currency} or any currency)</li>
                            </ul>
                        </div>

                        <h3 style="color: #1a4d2e;">📊 Next Steps</h3>
                        <ol style="color: #666; line-height: 1.8;">
                            <li>Explore our <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/demo/tables" style="color: #1a4d2e;">live demo</a></li>
                            <li>Schedule a call to see the system in action</li>
                            <li>Receive your personalized proposal for ${country}</li>
                        </ol>

                        <div style="text-align: center; margin: 2rem 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/tenant/demo/tables" 
                               style="display: inline-block; padding: 1rem 2.5rem; background: #1a4d2e; color: white; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 1.1rem;">
                                🎮 View Live Demo
                            </a>
                        </div>

                        <p style="color: #999; font-size: 0.9rem; border-top: 1px solid #eee; padding-top: 1rem; margin-top: 2rem;">
                            Any questions? Just reply to this email. We're here to help.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background: #f8f9fa; padding: 1.5rem; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="color: #999; font-size: 0.85rem; margin: 0;">
                            © 2026 Billar SaaS Platform • Pool hall infrastructure worldwide
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}
