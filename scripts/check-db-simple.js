
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking DB Status...');
        const tenants = await prisma.tenant.findMany();
        console.log(`Tenants found: ${tenants.length}`);
        tenants.forEach(t => console.log(`- ${t.name} (${t.slug}) [${t.businessModel}]`));

        const products = await prisma.product.findMany();
        console.log(`Products found: ${products.length}`);

        const tables = await prisma.table.findMany();
        console.log(`Tables found: ${tables.length}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
