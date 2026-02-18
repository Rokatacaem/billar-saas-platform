/**
 * Core Security - Intrusion Detector
 * Detecta patrones sospechosos y registra en SystemLog
 */

import { prisma } from '@/lib/prisma';

export enum ThreatLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

interface IntrusionEvent {
    type: string;
    severity: ThreatLevel;
    message: string;
    details?: Record<string, any>;
    ip?: string;
    userId?: string;
    tenantId?: string;
}

/**
 * Registra un evento de seguridad en SystemLog
 */
export async function logSecurityEvent(event: IntrusionEvent): Promise<void> {
    try {
        await prisma.systemLog.create({
            data: {
                level: 'ERROR', // Siempre ERROR o superior para eventos de seguridad
                message: `[SECURITY-${event.severity}] ${event.type}: ${event.message}`,
                details: {
                    ...event.details,
                    ip: event.ip,
                    userId: event.userId,
                    threatLevel: event.severity
                },
                tenantId: event.tenantId || null
            }
        });
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
}

/**
 * Detecta múltiples intentos fallidos de login
 */
export async function detectBruteForce(
    email: string,
    ip: string,
    windowMinutes: number = 5
): Promise<boolean> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const recentFailures = await prisma.systemLog.count({
        where: {
            level: 'ERROR',
            message: { contains: 'Login failed' },
            details: {
                path: ['email'],
                equals: email
            },
            createdAt: { gte: since }
        }
    });

    if (recentFailures >= 5) {
        await logSecurityEvent({
            type: 'BRUTE_FORCE_DETECTED',
            severity: ThreatLevel.HIGH,
            message: `${recentFailures} failed login attempts for ${email} in ${windowMinutes} minutes`,
            details: { email, failureCount: recentFailures },
            ip
        });
        return true;
    }

    return false;
}

/**
 * Detecta intentos de acceso cross-tenant
 */
export async function detectTenantViolation(
    userId: string,
    userTenantId: string,
    attemptedTenantId: string,
    ip: string
): Promise<void> {
    if (userTenantId !== attemptedTenantId) {
        await logSecurityEvent({
            type: 'TENANT_ISOLATION_VIOLATION',
            severity: ThreatLevel.CRITICAL,
            message: `User from tenant ${userTenantId} attempted to access tenant ${attemptedTenantId}`,
            details: {
                userTenantId,
                attemptedTenantId
            },
            ip,
            userId,
            tenantId: userTenantId
        });
    }
}

/**
 * Detecta patrones de SQL Injection en inputs
 */
export function detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
        /(--|\;|\/\*|\*\/)/,
        /(OR|AND)\s+\d+\s*=\s*\d+/i,
        /'.*OR.*'/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detecta XSS en inputs
 */
export function detectXSS(input: string): boolean {
    const xssPatterns = [
        /<script[^>]*>.*<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i, // onclick, onerror, etc.
        /<iframe/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Valida input y registra si es sospechoso
 */
export async function validateInput(
    input: string,
    fieldName: string,
    ip?: string,
    userId?: string,
    tenantId?: string
): Promise<boolean> {
    if (detectSQLInjection(input)) {
        await logSecurityEvent({
            type: 'SQL_INJECTION_ATTEMPT',
            severity: ThreatLevel.CRITICAL,
            message: `SQL injection pattern detected in field: ${fieldName}`,
            details: { fieldName, input: input.substring(0, 100) },
            ip,
            userId,
            tenantId
        });
        return false;
    }

    if (detectXSS(input)) {
        await logSecurityEvent({
            type: 'XSS_ATTEMPT',
            severity: ThreatLevel.HIGH,
            message: `XSS pattern detected in field: ${fieldName}`,
            details: { fieldName, input: input.substring(0, 100) },
            ip,
            userId,
            tenantId
        });
        return false;
    }

    return true;
}
