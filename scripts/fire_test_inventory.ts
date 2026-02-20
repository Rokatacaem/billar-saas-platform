import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * LÓGICA DE PRUEBA: Deducción de Stock Recursiva (Espejo de inventory-actions.ts)
 */
async function deductStockTest(
    productId: string,
    quantity: number,
    tenantId: string,
    tx?: any
) {
    const db = tx || prisma;
    const product = await db.product.findUnique({
        where: { id: productId },
        include: { recipes: true }
    });

    if (!product) throw new Error(`Producto ${productId} no encontrado`);

    if (product.recipes.length > 0) {
        for (const item of product.recipes) {
            const totalIngredientQty = item.quantity * quantity;
            await deductStockTest(item.ingredientId, totalIngredientQty, tenantId, db);
        }
    } else {
        await db.product.update({
            where: { id: productId },
            data: { stock: { decrement: Math.ceil(quantity) } }
        });

        await db.stockMovement.create({
            data: {
                productId,
                tenantId,
                quantity: -quantity,
                type: 'VENTA',
                reason: `Venta automática (TEST)`
            }
        });
    }
}

async function main() {
    console.log("🧪 Iniciando Prueba de Fuego (Lógica Embebida): Pisco Sour");

    const tenantId = "cmls11a5a0001o8wr668fhop3";

    // 1. Insumos
    const pisco = await prisma.product.upsert({
        where: { id: 'pisco-750' },
        update: { stock: 750 },
        create: { id: 'pisco-750', name: "Pisco 750ml", stock: 750, price: 25000, tenantId }
    });

    const limon = await prisma.product.upsert({
        where: { id: 'limon-kg' },
        update: { stock: 1000 },
        create: { id: 'limon-kg', name: "Limón kg", stock: 1000, price: 5000, tenantId }
    });

    const piscoSour = await prisma.product.upsert({
        where: { id: 'pisco-sour' },
        update: { price: 6500 },
        create: { id: 'pisco-sour', name: "Pisco Sour", price: 6500, tenantId }
    });

    await prisma.recipe.deleteMany({ where: { parentId: piscoSour.id } });
    await prisma.recipe.createMany({
        data: [
            { parentId: piscoSour.id, ingredientId: pisco.id, quantity: 90 },
            { parentId: piscoSour.id, ingredientId: limon.id, quantity: 30 }
        ]
    });

    // 2. Venta
    console.log("🚀 Simulando venta de 5 Pisco Sour...");
    await deductStockTest(piscoSour.id, 5, tenantId);

    // 3. Verificación
    const piscoF = await prisma.product.findUnique({ where: { id: pisco.id } });
    const limonF = await prisma.product.findUnique({ where: { id: limon.id } });

    console.log(`Pisco: ${piscoF?.stock}ml (Esperado: 300)`);
    console.log(`Limón: ${limonF?.stock}g (Esperado: 850)`);

    if (piscoF?.stock === 300 && limonF?.stock === 850) {
        console.log("✅ [ÉXITO]: Lógica de escandallos validada.");
    } else {
        console.error("❌ [FALLO]: Discrepancia en stock.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
