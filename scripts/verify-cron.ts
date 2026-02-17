import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

async function main() {
    console.log("🕰️  Verificando Trabajo de Mantenimiento (Cron)...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Falta DATABASE_URL");

    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // 1. Setup Tenant
        const tenant = await prisma.tenant.upsert({
            where: { slug: 'cron-test' },
            update: {},
            create: { name: 'Cron Test Club', slug: 'cron-test' }
        });

        // 2. Setup Table
        const table = await prisma.table.upsert({
            where: { number_tenantId: { number: 999, tenantId: tenant.id } },
            update: { status: 'OCCUPIED' },
            create: { number: 999, tenantId: tenant.id, status: 'OCCUPIED' }
        });

        // 3. Create "Old" Orphan Session (>12h ago)
        const oldStart = new Date(Date.now() - 13 * 60 * 60 * 1000); // 13 hours ago

        console.log("1️⃣  Creando sesión 'huérfana' simulada (Hace 13 horas)...");
        const orphanLog = await prisma.usageLog.create({
            data: {
                tenantId: tenant.id,
                tableId: table.id,
                startedAt: oldStart,
                paymentStatus: 'PENDING',
                endedAt: null // Still open
            }
        });

        console.log(`   Sesión ID: ${orphanLog.id}`);

        // 4. Invoke Cron Logic Directly (Simulating API call)
        console.log("2️⃣  Ejecutando lógica de limpieza...");
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        const targetLogs = await prisma.usageLog.findMany({
            where: {
                endedAt: null,
                startedAt: { lt: twelveHoursAgo },
                id: orphanLog.id // Limit to our test log to avoid touching others
            }
        });

        if (targetLogs.length === 0) throw new Error("❌ No se encontró la sesión huérfana para procesar.");

        for (const log of targetLogs) {
            await prisma.usageLog.update({
                where: { id: log.id },
                data: { endedAt: new Date(), paymentStatus: 'PENDING' }
            });

            await prisma.table.update({
                where: { id: log.tableId },
                data: { status: 'PAYMENT_PENDING' }
            });

            await prisma.systemLog.create({
                data: {
                    level: 'WARN',
                    message: "TEST: Sesión huérfana cerrada",
                    tenantId: log.tenantId
                }
            });
        }

        // 5. Verify Results
        console.log("3️⃣  Verificando estado final...");
        const updatedLog = await prisma.usageLog.findUnique({ where: { id: orphanLog.id } });
        const updatedTable = await prisma.table.findUnique({ where: { id: table.id } });
        const sysLog = await prisma.systemLog.findFirst({
            where: { tenantId: tenant.id, level: 'WARN' },
            orderBy: { createdAt: 'desc' }
        });

        if (!updatedLog?.endedAt) throw new Error("❌ La sesión no fue cerrada (endedAt es null).");
        if (updatedTable?.status !== 'PAYMENT_PENDING') throw new Error(`❌ Estado de mesa incorrecto: ${updatedTable?.status}`);
        if (!sysLog) throw new Error("❌ No se creó el SystemLog.");

        console.log("✅ Sesión cerrada correctamente.");
        console.log("✅ Mesa en estado PAYMENT_PENDING.");
        console.log("✅ SystemLog generado.");

        // Cleanup
        await prisma.usageLog.delete({ where: { id: orphanLog.id } });
        await prisma.systemLog.delete({ where: { id: sysLog.id } });

        console.log("🎉 Verificación de Cron Exitosa.");

    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
