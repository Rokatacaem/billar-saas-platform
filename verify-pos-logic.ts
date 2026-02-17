import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

console.log("🧪 Starting POS Logic Verification...");
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // 1. Setup Data - Find Tenant and Table
    // Use 'include' to check if relations work, but be careful with TS types if client is stale.
    // We use 'any' casting to avoid TS build errors in verification script if types are stale.
    const tenant = await prisma.tenant.findUnique({
        where: { slug: 'demo-club' },
        include: { tables: { orderBy: { number: 'asc' } }, products: true }
    }) as any;

    if (!tenant) throw new Error("Tenant not found. Run seed-data.ts first.");
    const table = tenant.tables[0]; // Table 1

    let product = tenant.products[0];
    if (!product) {
        console.warn("⚠️ No products found. Creating test product...");
        product = await prisma.product.create({
            data: {
                name: "Test Check Product",
                price: 2.0,
                stock: 100,
                tenantId: tenant.id
            }
        });
    }

    console.log(`📍 Using Table: #${table.number} (${table.id})`);
    console.log(`📍 Using Product: ${product.name} (Stock: ${product.stock})`);

    // 2. Simulate Start Session
    console.log("▶️ Starting Session...");
    const sessionStart = new Date();

    // Create UsageLog
    const usageLog = await prisma.usageLog.create({
        data: {
            tenantId: tenant.id,
            tableId: table.id,
            startedAt: sessionStart
            // endedAt is optional now
        }
    });

    // Update Table
    await prisma.table.update({
        where: { id: table.id },
        data: {
            status: 'OCCUPIED',
            lastSessionStart: sessionStart,
            currentSessionId: usageLog.id
        }
    });
    console.log(`✅ Session Started: ${usageLog.id}`);

    // 3. Improve Logic: Add Product (Simulate addProductToTable)
    console.log("🛒 Adding Product...");
    await prisma.$transaction(async (tx: any) => {
        // Decrement Stock
        await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: 1 } }
        });

        // Add Order Item
        await tx.orderItem.create({
            data: {
                quantity: 1,
                unitPrice: product.price,
                totalPrice: product.price * 1,
                productId: product.id,
                usageLogId: usageLog.id
            }
        });
    });

    // Check Stock
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    console.log(`✅ Product Assigned! New Stock: ${updatedProduct?.stock}`);

    // Check Order Item
    const sessionWithItems = await prisma.usageLog.findUnique({
        where: { id: usageLog.id },
        include: { items: true }
    }) as any; // Cast to avoid TS issues
    console.log(`✅ Order Items in Session: ${sessionWithItems?.items.length}`);

    if (sessionWithItems?.items.length !== 1) throw new Error("Verification Failed: Item not found in session.");

    // 4. Simulate End Session
    console.log("⏹️ Ending Session...");
    const now = new Date();
    // fast forward 1 min
    const durationMinutes = 1;
    const amountCharged = durationMinutes * tenant.baseRate; // simple logic

    await prisma.usageLog.update({
        where: { id: usageLog.id },
        data: {
            endedAt: now,
            durationMinutes,
            amountCharged
        }
    });

    await prisma.table.update({
        where: { id: table.id },
        data: {
            status: 'AVAILABLE',
            lastSessionStart: null,
            currentSessionId: null
        }
    });

    console.log(`✅ Session Ended. Charged: $${amountCharged}`);
    console.log("✅ VERIFICATION SUCCESSFUL");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
