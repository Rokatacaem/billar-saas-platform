import { prisma } from '../src/lib/prisma';

async function main() {
    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            businessModel: true,
            type: true,
            status: true,
        }
    });
    console.log('\n=== TENANTS EN DB ===');
    console.log(JSON.stringify(tenants, null, 2));
    console.log(`\nTotal: ${tenants.length} tenants`);
    await prisma.$disconnect();
}

main().catch(console.error);
