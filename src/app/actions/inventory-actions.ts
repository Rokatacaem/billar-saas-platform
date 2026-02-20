'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Definir un tipo más específico para el cliente de Prisma o transacción
type PrismaTransactionClient = Omit<
    typeof prisma,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * 📉 INVENTARIO: Deducción de Stock Recursiva (Escandallos)
 */
export async function deductStock(
    productId: string,
    quantity: number,
    tenantId: string,
    userId?: string,
    tx?: PrismaTransactionClient
) {
    const db = tx || prisma;

    try {
        const product = await db.product.findUnique({
            where: { id: productId },
            include: { recipes: true }
        });

        if (!product) throw new Error(`Producto ${productId} no encontrado para deducción`);

        if (product.recipes.length > 0) {
            // LÓGICA COMPUESTA: Descontar ingredientes de la receta
            for (const item of product.recipes) {
                const totalIngredientQty = item.quantity * quantity;
                await deductStock(item.ingredientId, totalIngredientQty, tenantId, userId, tx);
            }
        } else {
            // LÓGICA SIMPLE: Descontar stock del producto base
            await db.product.update({
                where: { id: productId },
                data: { stock: { decrement: Math.ceil(quantity) } }
            });

            // Registrar Movimiento en Kardex
            await db.stockMovement.create({
                data: {
                    productId,
                    tenantId,
                    quantity: -quantity,
                    type: 'VENTA',
                    userId: userId,
                    reason: `Venta automática vía POS`
                }
            });
        }
    } catch (error) {
        console.error("Error en deductStock:", error);
        throw error;
    }
}

/**
 * 📦 INVENTARIO: Upsert Product (Crear o Actualizar)
 */
export async function upsertProduct(data: {
    id?: string;
    name: string;
    sku?: string;
    price: number;
    costPrice?: number;
    stock: number;
    minStock?: number;
}) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    const tenantId = session.user.tenantId;

    try {
        if (data.id) {
            const existing = await prisma.product.findUnique({ where: { id: data.id } });
            if (!existing || existing.tenantId !== tenantId) throw new Error("Product not found or unauthorized");

            await prisma.product.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    sku: data.sku,
                    price: data.price,
                    costPrice: data.costPrice,
                    stock: data.stock,
                    minStock: data.minStock
                }
            });
        } else {
            await prisma.product.create({
                data: {
                    ...data,
                    tenantId
                }
            });
        }

        revalidatePath(`/tenant/[slug]/admin/inventory`);
        return { success: true };
    } catch (error) {
        console.error("Error upsertProduct:", error);
        return { success: false, error: "Error al guardar producto" };
    }
}

/**
 * 📉 INVENTARIO: Registro Manual de Movimiento / Mermas
 */
export async function recordManualMovement(productId: string, quantity: number, type: 'ENTRADA' | 'MERMA' | 'AJUSTE', reason: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error("Unauthorized");

    try {
        await prisma.$transaction(async (tx) => {
            // Actualizar Stock
            await tx.product.update({
                where: { id: productId },
                data: { stock: { increment: quantity } }
            });

            // Registrar Movimiento
            await tx.stockMovement.create({
                data: {
                    productId,
                    tenantId: session.user.tenantId!,
                    quantity,
                    type,
                    reason: type === 'MERMA' ? `[MERMA] ${reason}` : reason,
                    userId: session.user.id
                }
            });

            // 🛡️ SENTINEL: Si es una merma crítica, registrar en SystemLog
            if (type === 'MERMA' && Math.abs(quantity) > 5) {
                await tx.systemLog.create({
                    data: {
                        level: 'WARN',
                        message: `Merma detectada: ${quantity} unidades de producto ID ${productId}. Razón: ${reason}`,
                        tenantId: session.user.tenantId,
                        details: { userId: session.user.id }
                    }
                });
            }
        });

        revalidatePath(`/tenant/[slug]/admin/inventory`);
        return { success: true };
    } catch (error) {
        console.error("Error recordManualMovement:", error);
        return { success: false, error: "Error al registrar movimiento" };
    }
}

/**
 * 🧪 INVENTARIO: Guardar Receta (Escandallo)
 */
export async function saveRecipe(productId: string, ingredients: { ingredientId: string, quantity: number }[]) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') throw new Error("Unauthorized");

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Borrar receta existente
            await tx.recipe.deleteMany({
                where: { parentId: productId }
            });

            // 2. Crear nuevos items de receta
            if (ingredients.length > 0) {
                await tx.recipe.createMany({
                    data: ingredients.map(i => ({
                        parentId: productId,
                        ingredientId: i.ingredientId,
                        quantity: i.quantity
                    }))
                });
            }

            // 3. Recalcular costo del producto padre
            const recipeItems = await tx.recipe.findMany({
                where: { parentId: productId },
                include: { ingredient: true }
            });

            const totalCost = recipeItems.reduce((sum, item) => {
                return sum + (item.ingredient.costPrice * item.quantity);
            }, 0);

            await tx.product.update({
                where: { id: productId },
                data: { costPrice: totalCost }
            });
        });

        revalidatePath(`/tenant/[slug]/admin/inventory`);
        return { success: true };
    } catch (e) {
        console.error("Error saveRecipe:", e);
        return { success: false, error: "Error al guardar receta" };
    }
}

/**
 * 🗑️ INVENTARIO: Eliminar Producto
 */
export async function deleteProduct(productId: string) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') throw new Error("Unauthorized");

    try {
        await prisma.product.delete({
            where: { id: productId, tenantId: session.user.tenantId }
        });
        revalidatePath(`/tenant/[slug]/admin/inventory`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al eliminar (puede tener ventas relacionadas)" };
    }
}
