
import { prisma } from './src/lib/prisma';

async function main() {
    console.log("🔍 Verifying Prisma Client Integrity...");

    try {
        // Check if models exist on the client instance
        if (!prisma.product) {
            throw new Error("❌ prisma.product is undefined! Client extension might be broken.");
        }
        if (!prisma.tenant) {
            throw new Error("❌ prisma.tenant is undefined!");
        }

        // Try a simple query (should work without session as per logic)
        const productCount = await prisma.product.count();
        console.log(`✅ Prisma Client works. Found ${productCount} products.`);

        // Try a query on Tenant (should work as per BYPASS logic)
        const tenantCount = await prisma.tenant.count();
        console.log(`✅ Tenant query works. Found ${tenantCount} tenants.`);

        console.log("✅ RBAC Client Verification Successful");
    } catch (error) {
        console.error("❌ Verification Failed:", error);
        process.exit(1);
    }
}

main();
