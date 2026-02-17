import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const santiago = await prisma.tenant.findUnique({ where: { slug: 'santiago' } });
    const akapoolco = await prisma.tenant.findUnique({ where: { slug: 'akapoolco' } });

    if (!santiago || !akapoolco) {
        console.error('❌ Tenants not found!');
        return;
    }

    const santiagoTables = await prisma.table.count({ where: { tenantId: santiago.id } });
    const akapoolcoTables = await prisma.table.count({ where: { tenantId: akapoolco.id } });

    console.log(`Santiago Tables: ${santiagoTables} (Expected: 4)`);
    console.log(`Akapoolco Tables: ${akapoolcoTables} (Expected: 6)`);

    if (santiagoTables === 4 && akapoolcoTables === 6) {
        console.log('✅ Verification SUCCEEDED');
    } else {
        console.error('❌ Verification FAILED');
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
