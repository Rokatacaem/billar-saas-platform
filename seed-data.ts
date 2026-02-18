import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

console.log("🌱 Starting Database Seed...");
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // 1. Clean Slate (Optional, but good for reliable seed)
    // await prisma.orderItem.deleteMany();
    // await prisma.usageLog.deleteMany();
    // await prisma.product.deleteMany();
    // await prisma.table.deleteMany();
    // await prisma.user.deleteMany();
    // await prisma.tenant.deleteMany();

    // 2. Create Tenant
    const tenantName = "Billar Club Demo";
    const tenantSlug = "demo-club";

    // Upsert Tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: tenantSlug },
        update: {},
        create: {
            name: tenantName,
            slug: tenantSlug,
            type: "CLUB",
            primaryColor: "#000000",
            secondaryColor: "#FFD700",
            settings: { welcomeMessage: "Welcome to Demo Club" }
        }
    });

    console.log(`🏢 Tenant: ${tenant.name} (${tenant.id})`);

    // 3. Create Users
    await prisma.user.upsert({
        where: { email: "admin@demo.com" },
        update: {},
        create: {
            name: "Admin User",
            email: "admin@demo.com",
            role: "ADMIN",
            tenantId: tenant.id
        }
    });

    // 4. Create Tables
    for (let i = 1; i <= 4; i++) {
        await prisma.table.upsert({
            where: { number_tenantId: { number: i, tenantId: tenant.id } },
            update: {},
            create: {
                number: i,
                status: "AVAILABLE",
                tenantId: tenant.id
            }
        });
    }

    // 5. Create Products
    const products = [
        { name: "Coca-Cola", price: 2.50, stock: 50 },
        { name: "Cerveza", price: 3.50, stock: 100 },
        { name: "Nachos", price: 5.00, stock: 20 },
        { name: "Agua Mineral", price: 1.50, stock: 30 }
    ];

    for (const p of products) {
        // We don't have a unique constraint on name+tenantId easier to just createMany or findFirst
        const existing = await prisma.product.findFirst({
            where: { name: p.name, tenantId: tenant.id }
        });

        if (!existing) {
            await prisma.product.create({
                data: {
                    ...p,
                    tenantId: tenant.id
                }
            });
            console.log(`🍺 Created Product: ${p.name}`);
        }
    }

    console.log("✅ Seed completed successfully!");

    // --- AKAPOOLCO SEED ---
    const akapoolco = await prisma.tenant.upsert({
        where: { slug: 'akapoolco' },
        update: {},
        create: {
            name: 'Akapoolco Billar',
            slug: 'akapoolco',
            type: 'BUSINESS', // Correct enum value from schema
            businessModel: 'COMERCIAL',
            primaryColor: '#000000',
            secondaryColor: '#39FF14', // Neon Green
            settings: { welcomeMessage: "Bienvenido a Akapoolco" }
        }
    });
    console.log(`🏢 Tenant: ${akapoolco.name} (${akapoolco.id})`);

    // Create Tables for Akapoolco
    for (let i = 1; i <= 6; i++) {
        await prisma.table.upsert({
            where: { number_tenantId: { number: i, tenantId: akapoolco.id } },
            update: {},
            create: {
                number: i,
                status: 'AVAILABLE',
                tenantId: akapoolco.id
            }
        });
    }

    // Create Products for Akapoolco
    const akaProducts = [
        { name: "Mojito", price: 5000, stock: 100 },
        { name: "Pisco Sour", price: 4500, stock: 100 },
        { name: "Tabla Quesos", price: 12000, stock: 20 },
        { name: "Hora Pool", price: 8000, stock: 999 }
    ];

    for (const p of akaProducts) {
        const existing = await prisma.product.findFirst({
            where: { name: p.name, tenantId: akapoolco.id }
        });
        if (!existing) {
            await prisma.product.create({
                data: { ...p, tenantId: akapoolco.id }
            });
        }
    }
    console.log("✅ Akapoolco Seed completed!");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
