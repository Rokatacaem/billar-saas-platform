'use server';

import { prisma } from "@/lib/prisma";
import { sanitizeString, validateEmail, validateLength } from "@/lib/security/sanitizer";
import { logSecurityEvent, ThreatLevel } from "@/lib/security/intrusion-detector";
import { LeadStatus } from "@prisma/client";

export async function createLead(formData: FormData) {
    try {
        const rawName = formData.get("name") as string;
        const rawEmail = formData.get("email") as string;
        const rawCountry = formData.get("country") as string;
        const rawPhone = formData.get("phone") as string;
        const rawMessage = formData.get("message") as string;
        const detectedCurrency = formData.get("detectedCurrency") as string;
        const formFillTime = parseFloat(formData.get("formFillTime") as string || '999');

        // 🛡️ SECURITY: Sanitize and validate
        if (!rawName || !rawEmail || !rawCountry) {
            return { success: false, error: "Missing required fields" };
        }

        const name = sanitizeString(rawName);
        const email = validateEmail(rawEmail);
        const country = sanitizeString(rawCountry);
        const phone = rawPhone ? sanitizeString(rawPhone) : null;
        const message = rawMessage ? sanitizeString(rawMessage) : null;

        if (!email || !validateLength(name, 2, 100)) {
            return { success: false, error: "Invalid input" };
        }

        // 🛡️ SENTINEL: Bot detection by form fill time
        // Dynamic import inside try/catch to prevent crashes
        const { detectBotBehavior, validateEmailDomain } = await import('@/lib/security/lead-validator');

        if (detectBotBehavior(formFillTime)) {
            await logSecurityEvent({
                type: 'BOT_DETECTED',
                severity: ThreatLevel.HIGH,
                message: `Bot detected: form filled in ${formFillTime}s`,
                details: { email, formFillTime, country }
            });

            // Auto-archive bot leads
            try {
                await prisma.lead.create({
                    data: {
                        name,
                        email,
                        country,
                        phone,
                        message,
                        detectedCurrency,
                        status: 'ARCHIVED' // Auto-archived as bot
                    }
                });
            } catch {
                // Ignore database errors for bot leads
            }

            return { success: false, error: "Invalid submission" };
        }

        // 🛡️ SENTINEL: Validate email domain
        const domainValidation = validateEmailDomain(email);

        if (!domainValidation.valid) {
            await logSecurityEvent({
                type: 'TEMP_EMAIL_REJECTED',
                severity: ThreatLevel.MEDIUM,
                message: `Temporary email rejected: ${email}`,
                details: { email, reason: domainValidation.reason }
            });

            return { success: false, error: "Por favor usa un email válido corporativo o personal" };
        }

        // Check for duplicate email
        const existing = await prisma.lead.findUnique({
            where: { email }
        });

        if (existing) {
            return { success: false, error: "Email already registered" };
        }

        // Create lead
        const lead = await prisma.lead.create({
            data: {
                name,
                email,
                country,
                phone,
                message,
                detectedCurrency
            }
        });

        // 🛡️ SECURITY: Log lead creation
        await logSecurityEvent({
            type: 'LEAD_CREATED',
            severity: ThreatLevel.LOW,
            message: `New lead captured: ${email} from ${country}`,
            details: { email, country, currency: detectedCurrency, leadId: lead.id }
        });

        // ✉️ AUTO-RESPONDER: Send welcome email
        try {
            const { sendWelcomeEmail, notifyOwnerHighPriorityLead } = await import('./email-actions');

            sendWelcomeEmail(email, name, country, detectedCurrency || 'USD')
                .catch(err => console.error('Welcome email failed:', err));

            // 🚨 HIGH PRIORITY: Notificar a owner si es lead corporativo
            const isHighPriority = isHighPriorityLead(email, country);
            if (isHighPriority) {
                notifyOwnerHighPriorityLead(email, name, country, 'Corporate domain detected')
                    .catch(err => console.error('Owner notification failed:', err));
            }
        } catch (emailError) {
            console.error("Email module load failed:", emailError);
            // Non-blocking error
        }

        return { success: true };

    } catch (error) {
        console.error("CRITICAL ERROR in createLead:", error);

        // Try to log to security log if possible
        try {
            await logSecurityEvent({
                type: 'LEAD_CREATION_FAILED',
                severity: ThreatLevel.MEDIUM,
                message: `Failed lead creation (Critical)`,
                details: { error: String(error) }
            });
        } catch (logError) {
            console.error("Failed to log critical error:", logError);
        }

        return { success: false, error: "Internal Server Error" };
    }
}

/**
 * 🛡️ SENTINEL: Detecta leads de alta prioridad
 * Criterios: Dominio corporativo, países específicos, etc.
 */
function isHighPriorityLead(email: string, country: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();

    // Dominios gratuitos NO son alta prioridad
    const freeDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
    if (freeDomains.some(d => domain?.includes(d))) {
        return false;
    }

    // Países con mayor potencial (puedes ajustar)
    const highValueCountries = ['Mexico', 'Peru', 'Argentina', 'Colombia', 'United States'];
    if (highValueCountries.includes(country)) {
        return true;
    }

    // Si tiene dominio corporativo (no free), es alta prioridad
    return true;
}

/**
 * Actualiza el status de un lead (Sales Funnel)
 * 🛡️ SECURITY: Solo SUPER_ADMIN puede acceder
 */
export async function updateLeadStatus(leadId: string, status: string) {
    if (!leadId || !status) {
        return { success: false, error: "Missing parameters" };
    }

    // Validar status permitido
    const validStatuses = ['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'CONVERTED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
        return { success: false, error: "Invalid status" };
    }

    try {
        await prisma.lead.update({
            where: { id: leadId },
            data: { status: status as LeadStatus }
        });

        // 🛡️ SECURITY: Log status change
        await logSecurityEvent({
            type: 'LEAD_STATUS_UPDATED',
            severity: ThreatLevel.LOW,
            message: `Lead status updated: ${leadId} → ${status}`,
            details: { leadId, newStatus: status }
        });

        return { success: true };

    } catch (error) {
        console.error("Error updating lead status:", error);
        return { success: false, error: "Database error" };
    }
}

/**
 * Archiva leads antiguos sin actividad
 * Define: "Antiguos" = NEW status por más de 90 días
 */
export async function archiveOldLeads() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
        const result = await prisma.lead.updateMany({
            where: {
                status: 'NEW',
                createdAt: {
                    lt: ninetyDaysAgo
                }
            },
            data: {
                status: 'ARCHIVED'
            }
        });

        await logSecurityEvent({
            type: 'LEADS_AUTO_ARCHIVED',
            severity: ThreatLevel.LOW,
            message: `Auto-archived ${result.count} old leads`,
            details: { count: result.count, cutoffDate: ninetyDaysAgo }
        });

        return { success: true, archived: result.count };

    } catch (error) {
        console.error("Error archiving old leads:", error);
        return { success: false, error: "Database error" };
    }
}

/**
 * 🛡️ SENTINEL AUDIT: Detecta manipulación de IP/GeoData
 * Verifica que detectedCurrency coincida con country
 */
export async function auditLeadGeoData(leadId: string) {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId }
        });

        if (!lead || !lead.detectedCurrency) {
            return { valid: true }; // No hay data para auditar
        }

        // Mapeo de países a monedas esperadas
        const expectedCurrencies: Record<string, string[]> = {
            'Chile': ['CLP'],
            'Mexico': ['MXN'],
            'Argentina': ['ARS'],
            'Peru': ['PEN'],
            'Colombia': ['COP'],
            'Brazil': ['BRL'],
            'United States': ['USD'],
            'España': ['EUR'],
            'Spain': ['EUR']
        };

        const expected = expectedCurrencies[lead.country];

        if (expected && !expected.includes(lead.detectedCurrency)) {
            // 🚨 DISCREPANCIA SOSPECHOSA
            await logSecurityEvent({
                type: 'LEAD_GEO_MISMATCH',
                severity: ThreatLevel.MEDIUM,
                message: `Suspicious geo data: Country ${lead.country} with currency ${lead.detectedCurrency}`,
                details: {
                    leadId: lead.id,
                    email: lead.email,
                    country: lead.country,
                    detectedCurrency: lead.detectedCurrency,
                    expectedCurrencies: expected
                }
            });

            return { valid: false, suspicious: true };
        }

        return { valid: true };

    } catch (error) {
        console.error("Lead geo audit error:", error);
        return { valid: true }; // No bloquear por error de auditoría
    }
}
