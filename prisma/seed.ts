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
const pool = new Pool({ connectionString });
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

    console.log('🏁 Sembrado completado.');
}

main()
    .catch((e) => {
        console.error('❌ Error fatal en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });