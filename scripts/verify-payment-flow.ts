import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

async function main() {
    console.log("💳 Iniciando Verificación de Flujo de Pagos...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Falta DATABASE_URL");

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // 1. Setup Tenant
        console.log("1️⃣  Configurando Tenant de prueba...");
        const tenant = await prisma.tenant.upsert({
            where: { slug: 'payment-test-club' },
            update: {},
            create: { name: 'Payment Test Club', slug: 'payment-test-club', type: 'CLUB' }
        });

        // 2. Setup Table
        const table = await prisma.table.upsert({
            where: { number_tenantId: { number: 101, tenantId: tenant.id } },
            update: {},
            create: { number: 101, tenantId: tenant.id, status: 'AVAILABLE' }
        });

        // 3. Create Usage Log (Mock Session)
        console.log("2️⃣  Creando Sesión y Registro de Uso...");
        const usageLog = await prisma.usageLog.create({
            data: {
                tenantId: tenant.id,
                tableId: table.id,
                startedAt: new Date(Date.now() - 3600000), // 1 hour ago
                endedAt: new Date(),
                durationMinutes: 60,
                amountCharged: 1000,
                paymentStatus: 'PENDING'
            }
        });

        console.log(`   UsageLog Creado: ${usageLog.id} | Status: ${usageLog.paymentStatus}`);

        // 4. Create Payment Record (Simulate Payment)
        console.log("3️⃣  Simulando Pago (Creando PaymentRecord)...");
        const payment = await prisma.paymentRecord.create({
            data: {
                amount: 1000,
                method: 'CARD', // Match enum/string
                status: 'COMPLETED',
                provider: 'MOCK_STRIPE',
                transactionId: `tx_${Date.now()}`,
                usageLogId: usageLog.id,
                tenantId: tenant.id
            }
        });

        // 5. Update UsageLog Status
        await prisma.usageLog.update({
            where: { id: usageLog.id },
            data: { paymentStatus: 'PAID' }
        });

        console.log(`   Pago Registrado: ${payment.id} | Monto: ${payment.amount}`);

        // 6. Verify Relations
        console.log("4️⃣  Verificando Relaciones...");

        const tenantWithPayments = await prisma.tenant.findUnique({
            where: { id: tenant.id },
            include: { paymentRecords: true }
        });

        if (!tenantWithPayments || tenantWithPayments.paymentRecords.length === 0) {
            throw new Error("❌ Error: Tenant no tiene registros de pago vinculados.");
        }

        const foundPayment = tenantWithPayments.paymentRecords.find(p => p.id === payment.id);
        if (!foundPayment) throw new Error("❌ Error: Pago específico no encontrado en la lista del Tenant.");

        console.log("✅ Relación Tenant -> PaymentRecord verificada.");

        // Cleanup
        console.log("🧹 Limpiando datos de prueba...");
        await prisma.paymentRecord.delete({ where: { id: payment.id } });
        await prisma.usageLog.delete({ where: { id: usageLog.id } });
        // Keep tenant/table for reuse or manual check

        console.log("🎉 Verificación de Pagos Exitosa.");

    } catch (e) {
        console.error("❌ Error en verificación:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
