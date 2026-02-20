'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 🛍️ POS Action: Charge Product to Table
export async function addProductToTable(tableId: string, productId: string, quantity: number) {
    if (!tableId || !productId || quantity <= 0) {
        throw new Error("Invalid request data");
    }

    // 1. Get Session & Tenant (Security Check)
    // In a real app, we get tenantId from session. 
    // Here we rely on the component ensuring context, but good practice to double check if we had auth() available here easily.
    // For now, we trust the IDs are consistent or we check them in query.

    try {
        await prisma.$transaction(async (tx) => {
            // 2. Fetch Assets & Validate Status
            const table = await tx.table.findUniqueOrThrow({
                where: { id: tableId },
                include: {
                    usageLogs: {
                        where: { endedAt: { equals: new Date("1970-01-01T00:00:00.000Z") } }, // Approximation of "Active"?? 
                        // Actually, standard is `endedAt` is null? No, schema says `endedAt DateTime`. 
                        // We need to check how "Active" is defined. 
                        // Checking `check-liverpool.ts` or similar logic might reveal it.
                        // Usually `endedAt` is future or null. 
                        // Schema: usageLog `endedAt` is DateTime (not optional?). 
                        // Let's check schema again. `endedAt DateTime`. 
                        // If checking active session, maybe `endedAt` is set to "future" or we look for `currentSessionId` in Table?
                        // `Table` has `currentSessionId String?`.
                    }
                }
            });

            if (table.status !== 'OCCUPIED' || !table.currentSessionId) {
                throw new Error("Table is not active. Cannot add items.");
            }

            const product = await tx.product.findUniqueOrThrow({
                where: { id: productId }
            });

            // 3. Validate Tenant Isolation
            if (table.tenantId !== product.tenantId) {
                throw new Error("Security Violation: Tenant Mismatch");
            }

            // 4. Check Stock
            if (product.stock < quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
            }

            // 5. Execute Transaction
            // Note: We avoid decrementing stock here manually and use the new deductStock logic 
            // which handles recursion (recipes) and Kardex logging.
            const { deductStock } = await import("./inventory-actions");
            await deductStock(productId, quantity, table.tenantId, undefined, tx);

            // Add Order Item to Active Session
            await tx.orderItem.create({
                data: {
                    quantity,
                    unitPrice: product.price, // Snapshot price
                    totalPrice: product.price * quantity,
                    productId: product.id,
                    usageLogId: table.currentSessionId!
                }
            });
        });

        console.log(`✅ Added ${quantity} of product ${productId} to table ${tableId}`);
        revalidatePath(`/tenant/${tableId}`); // Revalidate relevant path, assuming table view
        return { success: true };

    } catch (error) {
        console.error("❌ POS Error:", error);
        throw error;
    }
}

// 📦 POS Action: Get Active Session Details
export async function getTableSession(tableId: string) {
    // 1. Find active session for table
    // We look for a table with status OCCUPIED and get its currentSessionId
    const table = await prisma.table.findUnique({
        where: { id: tableId },
    });

    if (!table || !table.currentSessionId) {
        return null;
    }

    const usageLog = await prisma.usageLog.findUnique({
        where: { id: table.currentSessionId },
        include: {
            items: {
                include: { product: true }
            }
        }
    });

    return usageLog;
}
