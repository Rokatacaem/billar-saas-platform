/**
 * Edge-safe logger for Middleware
 * Replaces intrusion-detector for Edge Runtime contexts
 */

export enum ThreatLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

interface SecurityEvent {
    type: string;
    severity: ThreatLevel;
    message: string;
    details?: Record<string, any>;
    ip?: string;
    userId?: string;
    tenantId?: string;
}

/**
 * Logs security events to stdout (Edge safe)
 * In production, these logs should be captured by the infrastructure (Vercel Logs, etc.)
 */
export async function logSecurityEventEdge(event: SecurityEvent): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
        timestamp,
        level: 'SECURITY_ALERT',
        ...event
    }));
}

/**
 * Detects tenant isolation violations (Edge safe version)
 * Logs to console/stdout matches the signature needed by middleware
 */
export async function detectTenantViolationEdge(
    userId: string,
    userTenantId: string,
    attemptedTenantId: string,
    ip: string
): Promise<void> {
    if (userTenantId !== attemptedTenantId) {
        await logSecurityEventEdge({
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
