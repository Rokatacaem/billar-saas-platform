import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';


console.log("🚀 Starting check-liverpool.ts script...");
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🔍 Listing ALL tenants...");
    const tenants = await prisma.tenant.findMany({
        include: {
            users: true,
            tables: true
        }
    });

    if (tenants.length === 0) {
        console.log("❌ No tenants found in database.");
    }

    tenants.forEach(t => {
        console.log(`🏠 Tenant: ${t.name} (Slug: '${t.slug}') | ID: ${t.id}`);
        console.log(`   - Tables: ${t.tables.length}`);
        console.log(`   - Users: ${t.users.length} (${t.users.map(u => u.email).join(', ')})`);
        console.log('------------------------------------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
