import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        include: { tenant: true }
    });

    console.log("Found Super Admins:", JSON.stringify(superAdmins, null, 2));

    // Also list all tenants
    const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true, slug: true }
    });
    console.log("\nAll Tenants:", JSON.stringify(tenants, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
