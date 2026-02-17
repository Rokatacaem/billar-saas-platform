'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

interface ProductFormData {
    id?: string;
    name: string;
    price: number;
    stock: number;
}

export async function upsertProduct(data: ProductFormData) {
    const session = await auth();

    // 1. Authentication & Authorization
    if (!session?.user?.email || !session?.user?.tenantId) {
        throw new Error("Unauthorized: No active session");
    }

    if (session.user.role !== 'ADMIN') {
        throw new Error("Forbidden: Only Admins can manage inventory");
    }

    const tenantId = session.user.tenantId;

    // 2. Validation
    if (!data.name || data.name.trim().length === 0) {
        return { error: "Product name is required" };
    }
    if (data.price < 0) {
        return { error: "Price cannot be negative" };
    }
    if (data.stock < 0) {
        return { error: "Stock cannot be negative" };
    }

    try {
        if (data.id) {
            // Update Existing Product
            // Ensure the product belongs to the current tenant!
            const existingProduct = await prisma.product.findUnique({
                where: { id: data.id }
            });

            if (!existingProduct) {
                return { error: "Product not found" };
            }

            if (existingProduct.tenantId !== tenantId) {
                throw new Error("Security Violation: Attempting to update product from another tenant");
            }

            await prisma.product.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    price: data.price,
                    stock: data.stock,
                }
            });
        } else {
            // Create New Product
            await prisma.product.create({
                data: {
                    name: data.name,
                    price: data.price,
                    stock: data.stock,
                    tenantId: tenantId
                }
            });
        }

        revalidatePath(`/tenant/[slug]`); // Refreshes POS and lists
        revalidatePath(`/tenant/[slug]/admin/inventory`);

        return { success: true };

    } catch (error) {
        console.error("Inventory Action Error:", error);
        return { error: "Failed to save product" };
    }
}

export async function deleteProduct(productId: string) {
    const session = await auth();

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    try {
        // Prisma extension or manual check handles tenant isolation
        await prisma.product.delete({
            where: {
                id: productId,
                tenantId: session.user.tenantId // Explicitly enforcing isolation
            }
        });

        revalidatePath(`/tenant/[slug]`);
        revalidatePath(`/tenant/[slug]/admin/inventory`);

        return { success: true };
    } catch (error) {
        return { error: "Failed to delete product (It might have related orders)" };
    }
}
