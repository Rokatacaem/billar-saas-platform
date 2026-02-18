'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkRateLimit, apiLimiter } from "@/lib/security/rate-limiter";
import { logSecurityEvent, ThreatLevel } from "@/lib/security/intrusion-detector";
import validator from 'validator';

export async function createServiceRequest(tenantId: string, tableId: string, type: 'CALL' | 'ORDER') {
    if (!tenantId || !tableId) return { success: false, error: "Missing params" };

    // 🛡️ SECURITY: Validate UUIDs to prevent injection
    if (!validator.isUUID(tenantId) || !validator.isUUID(tableId)) {
        await logSecurityEvent({
            type: 'INVALID_UUID_ATTEMPT',
            severity: ThreatLevel.MEDIUM,
            message: 'Invalid UUID in service request',
            details: { tenantId, tableId },
            tenantId
        });
        return { success: false, error: "Invalid identifiers" };
    }

    // 🛡️ SECURITY: Rate limiting by tenantId to prevent spam
    const rateLimitKey = `qr:${tenantId}`;
    const rateLimit = checkRateLimit(rateLimitKey, apiLimiter);

    if (!rateLimit.allowed) {
        await logSecurityEvent({
            type: 'QR_RATE_LIMIT_EXCEEDED',
            severity: ThreatLevel.MEDIUM,
            message: 'QR service request rate limit exceeded',
            details: { tenantId, retryAfter: rateLimit.retryAfter },
            tenantId
        });
        return {
            success: false,
            error: `Rate limit exceeded. Retry in ${rateLimit.retryAfter} seconds`
        };
    }

    try {
        await prisma.serviceRequest.create({
            data: {
                tenantId,
                tableId,
                type: type, // Matches enum
                status: 'PENDING'
            }
        });

        // Revalidate admin dashboard so staff sees the notification immediately (if using polling or revalidation)
        // For real-time, we'd use a subscription or polling on the client.
        // For now, revalidate the tenant path.
        revalidatePath(`/tenant/[slug]`);
        return { success: true };
    } catch (error) {
        console.error("Error creating service request:", error);

        await logSecurityEvent({
            type: 'SERVICE_REQUEST_ERROR',
            severity: ThreatLevel.LOW,
            message: 'Failed to create service request',
            details: { tenantId, tableId, error: String(error) },
            tenantId
        });

        return { success: false, error: "Database error" };
    }
}
