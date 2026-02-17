import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Carga automática de .env
dotenv.config();

console.log('🔍 Checking DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'UNDEFINED');

// 2. Inicialización limpia para Prisma 7.4.0 usando Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Iniciando el sembrado de datos en Neon (Adapter Mode)...');

    // 1. Crear el Club de Billar Santiago (Modelo CLUB)
    const santiago = await prisma.tenant.upsert({
        where: { slug: 'santiago' },
        update: {},
        create: {
            name: 'Club de Billar Santiago',
            slug: 'santiago',
            type: 'CLUB',
            primaryColor: '#1a4d2e',
            secondaryColor: '#ffffff',
            settings: {
                welcomeMessage: 'Bienvenidos al Club Santiago',
                allowGuestBooking: true
            }
        }
    });
    console.log(`✅ Tenant listo: ${santiago.name}`);

    // 2. Akapoolco
    const akapoolco = await prisma.tenant.upsert({
        where: { slug: 'akapoolco' },
        update: {},
        create: {
            name: 'Akapoolco Billar & Bar',
            slug: 'akapoolco',
            type: 'BUSINESS',
            primaryColor: '#000000',
            secondaryColor: '#ffd700',
            settings: {
                welcomeMessage: 'Bienvenidos a Akapoolco',
                allowGuestBooking: false
            }
        }
    });
    console.log(`✅ Tenant listo: ${akapoolco.name}`);

    // 3. Admin User
    const user = await prisma.user.upsert({
        where: { email: 'rodrigo@akapoolco.cl' },
        update: {},
        create: {
            name: 'Rodrigo',
            email: 'rodrigo@akapoolco.cl',
            role: 'ADMIN',
            tenantId: akapoolco.id
        }
    });
    console.log(`👤 Usuario administrador creado: ${user.email}`);

    const santiagoUser = await prisma.user.upsert({
        where: { email: 'admin@santiago.cl' },
        update: {},
        create: {
            name: 'Admin Santiago',
            email: 'admin@santiago.cl',
            role: 'ADMIN',
            tenantId: santiago.id
        }
    });
    console.log(`👤 Usuario Santiago creado: ${santiagoUser.email}`);

    console.log('🎱 Antigravity: Poblando infraestructura de mesas...');

    // Configuración de mesas por club
    const clubs = [
        { id: santiago.id, count: 4, name: 'Club Santiago' },
        { id: akapoolco.id, count: 6, name: 'Akapoolco' }
    ];

    for (const club of clubs) {
        for (let i = 1; i <= club.count; i++) {
            await prisma.table.upsert({
                where: { number_tenantId: { number: i, tenantId: club.id } },
                update: {},
                create: {
                    number: i,
                    status: i % 3 === 0 ? 'OCCUPIED' : 'AVAILABLE',
                    tenantId: club.id
                }
            });
        }
        console.log(`✅ ${club.count} mesas creadas para ${club.name}`);
    }

    console.log('🏁 Proceso de Antigravity finalizado.');
}

main()
    .catch((e) => {
        console.error('❌ Error fatal en el seed:', e);
        const fs = require('fs');
        fs.writeFileSync('seed_error.log', JSON.stringify(e, null, 2) + '\n' + e.toString());
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });