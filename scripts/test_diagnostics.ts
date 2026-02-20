import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log("🔍 Intentando upsert de producto de prueba...");
    const tenantId = "cmls11a5a0001o8wr668fhop3"; // Akapoolco

    try {
        const res = await prisma.product.upsert({
            where: { id: 'debug-prod-1' },
            create: {
                id: 'debug-prod-1',
                name: "Debug Product",
                price: 100,
                tenantId: tenantId
            },
            update: {
                name: "Debug Product Updated"
            }
        });
        console.log("✅ Upsert exitoso:", res.id);
    } catch (err: any) {
        console.error("❌ ERROR DETALLADO:");
        console.error("Mensaje:", err.message);
        console.error("Código:", err.code);
        console.error("Meta:", JSON.stringify(err.meta, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
