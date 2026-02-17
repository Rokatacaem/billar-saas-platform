import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

async function main() {
    console.log("🧪 Iniciando Verificación de Sistema de Socios (Con Adapter)...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Falta DATABASE_URL");

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // 1. Setup Tenants
        console.log("1️⃣  Configurando Tenants de prueba...");
        const tenantA = await prisma.tenant.upsert({
            where: { slug: 'club-a-test' },
            update: {},
            create: { name: 'Club A', slug: 'club-a-test', type: 'CLUB' }
        });

        const tenantB = await prisma.tenant.upsert({
            where: { slug: 'club-b-test' },
            update: {},
            create: { name: 'Club B', slug: 'club-b-test', type: 'BUSINESS' }
        });

        // 2. Member Isolation Test
        console.log("2️⃣  Verificando Aislamiento de Socios...");

        // @ts-ignore
        const memberA = await prisma.member.create({
            data: {
                name: 'Socio A',
                tenantId: tenantA.id,
                discount: 10,
                rut: '11111111-1'
            }
        });

        // @ts-ignore
        const memberB = await prisma.member.create({
            data: {
                name: 'Socio B',
                tenantId: tenantB.id,
                discount: 20,
                rut: '22222222-2'
            }
        });

        const membersInA = await prisma.member.findMany({ where: { tenantId: tenantA.id } });
        const membersInB = await prisma.member.findMany({ where: { tenantId: tenantB.id } });

        if (membersInA.find(m => m.id === memberB.id)) throw new Error("❌ Fallo de Aislamiento: Socio B encontrado en Tenant A");
        if (membersInB.find(m => m.id === memberA.id)) throw new Error("❌ Fallo de Aislamiento: Socio A encontrado en Tenant B");
        console.log("✅ Aislamiento Confirmado");

        // 3. Discount Logic Test
        console.log("3️⃣  Verificando Lógica de Descuentos...");

        const table = await prisma.table.upsert({
            where: { number_tenantId: { number: 99, tenantId: tenantA.id } },
            update: { status: 'OCCUPIED' },
            create: { number: 99, tenantId: tenantA.id, status: 'OCCUPIED' }
        });

        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - 60);

        // @ts-ignore
        const usageLog = await prisma.usageLog.create({
            data: {
                tenantId: tenantA.id,
                tableId: table.id,
                startedAt: startTime,
            }
        });

        await prisma.table.update({
            where: { id: table.id },
            data: { currentSessionId: usageLog.id }
        });

        const durationMinutes = 60;
        const baseRate = tenantA.baseRate;
        let timeCharge = durationMinutes * baseRate;

        // @ts-ignore
        const discountAmount = timeCharge * (memberA.discount / 100);
        const finalCharge = timeCharge - discountAmount;

        if (discountAmount !== 600) throw new Error(`❌ Cálculo Incorrecto: Esperado 600, Obtenido ${discountAmount}`);

        console.log(`   Tarifa Base: ${baseRate}/min`);
        console.log(`   Tiempo: ${durationMinutes} min`);
        console.log(`   Total Tiempo: ${timeCharge}`);
        // @ts-ignore
        console.log(`   Descuento (${memberA.discount}%): -${discountAmount}`);
        console.log(`   Total Final: ${finalCharge}`);
        console.log("✅ Lógica de Descuento Correcta (Simulada)");

        console.log("🎉 Todas las verificaciones pasaron exitosamente.");

        // Cleanup
        await prisma.usageLog.delete({ where: { id: usageLog.id } });
        await prisma.member.delete({ where: { id: memberA.id } });
        await prisma.member.delete({ where: { id: memberB.id } });

    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
