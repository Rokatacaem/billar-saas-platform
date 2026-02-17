'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createServiceRequest(tenantId: string, tableId: string, type: 'CALL' | 'ORDER') {
    if (!tenantId || !tableId) return { success: false, error: "Missing params" };

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
        return { success: false, error: "Database error" };
    }
}
