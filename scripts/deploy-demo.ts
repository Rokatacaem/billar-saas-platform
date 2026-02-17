import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

async function main() {
    console.log("🚀 Iniciando Despliegue de Modo Demo...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Falta DATABASE_URL");

    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // 1. Clean & Create Tenant
        console.log("🏢 Configurando Tenant 'Club Demo Pro'...");

        // Delete existing demo data if any (Cascade should handle relations, but let's be safe)
        const existing = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
        if (existing) {
            console.log("   Limpiando datos anteriores...");
            await prisma.paymentRecord.deleteMany({ where: { tenantId: existing.id } });
            await prisma.usageLog.deleteMany({ where: { tenantId: existing.id } });
            await prisma.table.deleteMany({ where: { tenantId: existing.id } });
            await prisma.product.deleteMany({ where: { tenantId: existing.id } });
            await prisma.member.deleteMany({ where: { tenantId: existing.id } });
            await prisma.tenant.delete({ where: { id: existing.id } });
        }

        const tenant = await prisma.tenant.create({
            data: {
                name: "Club Demo Pro",
                slug: "demo",
                type: "BUSINESS",
                primaryColor: "#0f172a", // Slate 900
                secondaryColor: "#3b82f6", // Blue 500
                baseRate: 6000, // $6000/hr
            }
        });

        // 2. Create Inventory
        console.log("📦 Creando Inventario...");
        // Categories not yet implemented in Schema, creating flat products

        const products = await Promise.all([
            prisma.product.create({ data: { name: "Cerveza Artesanal", price: 4500, stock: 100, tenantId: tenant.id } }),
            prisma.product.create({ data: { name: "Pisco Sour", price: 5500, stock: 50, tenantId: tenant.id } }),
            prisma.product.create({ data: { name: "Bebida 350ml", price: 2000, stock: 200, tenantId: tenant.id } }),
            prisma.product.create({ data: { name: "Tabla de Quesos", price: 12000, stock: 20, tenantId: tenant.id } }),
            prisma.product.create({ data: { name: "Papas Fritas", price: 4000, stock: 50, tenantId: tenant.id } }),
        ]);

        // 3. Create Tables
        // 3. Create Tables
        console.log("🎱 Configurando Mesas...");
        await prisma.table.createMany({
            data: Array.from({ length: 10 }, (_, i) => ({
                number: i + 1,
                tenantId: tenant.id,
                status: 'AVAILABLE'
            }))
        });
        const tables = await prisma.table.findMany({ where: { tenantId: tenant.id } });

        // 4. Create Members
        console.log("👥 Registrando Socios VIP...");
        const members = await Promise.all([
            prisma.member.create({ data: { name: "Rodrigo Kata", email: "ceo@billar.com", discount: 20, tenantId: tenant.id, amountSpent: 0 } }),
            prisma.member.create({ data: { name: "Demo User", email: "demo@user.com", discount: 10, tenantId: tenant.id, amountSpent: 0 } }),
            prisma.member.create({ data: { name: "Cliente Frecuente", email: "vip@client.com", discount: 15, tenantId: tenant.id, amountSpent: 0 } }),
        ]);

        // 5. Simulate Historical Data (Past 7 Days)
        console.log("📈 Generando Historia de Ventas (Últimos 7 días)...");
        const today = new Date();
        const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

        for (let d = 7; d >= 0; d--) {
            const date = new Date(today.getTime() - d * MILLIS_PER_DAY);
            // Random number of sessions per day (3-8)
            const sessionsCount = Math.floor(Math.random() * 5) + 3;

            for (let s = 0; s < sessionsCount; s++) {
                // Random duration 30-180 mins
                const duration = Math.floor(Math.random() * 150) + 30;
                const startTime = new Date(date.getTime() + Math.random() * 8 * 60 * 60 * 1000); // During open hours
                const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

                // Calculate Mock Charge
                const timeCharge = (duration / 60) * tenant.baseRate;
                // Random Consumption
                const itemsCount = Math.floor(Math.random() * 3);
                let itemsTotal = 0;
                const sessionItems = [];

                for (let k = 0; k < itemsCount; k++) {
                    const prod = products[Math.floor(Math.random() * products.length)];
                    const qty = Math.floor(Math.random() * 2) + 1;
                    itemsTotal += prod.price * qty;
                    sessionItems.push({
                        product: { connect: { id: prod.id } },
                        quantity: qty,
                        unitPrice: prod.price,
                        totalPrice: prod.price * qty
                    });
                }

                const total = Math.round(timeCharge + itemsTotal);

                // Create Log
                const log = await prisma.usageLog.create({
                    data: {
                        tenantId: tenant.id,
                        tableId: tables[Math.floor(Math.random() * tables.length)].id,
                        startedAt: startTime,
                        endedAt: endTime,
                        durationMinutes: duration,
                        amountCharged: total,
                        paymentStatus: 'PAID',
                        items: {
                            create: sessionItems
                        }
                    }
                });

                // Create Payment
                await prisma.paymentRecord.create({
                    data: {
                        tenant: { connect: { id: tenant.id } },
                        usageLog: { connect: { id: log.id } },
                        amount: total,
                        method: Math.random() > 0.5 ? 'CARD' : 'CASH',
                        status: 'COMPLETED',
                        provider: 'DEMO',
                        createdAt: endTime // Payment at end time
                    }
                });
            }
        }

        console.log("✅ Despliegue Demo Completado!");
        console.log(`🌍 Accede en: /tenant/demo`);

    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
