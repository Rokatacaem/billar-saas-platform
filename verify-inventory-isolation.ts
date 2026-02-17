
import { prisma } from './src/lib/prisma';

async function main() {
    console.log("🔍 Verifying Inventory Isolation...");

    try {
        // 1. Get Two Tenants (Assuming they exist from seeds)
        // We need real IDs to test DB isolation
        const tenantA = await prisma.tenant.findFirst({ where: { slug: 'akapoolco' } });
        const tenantB = await prisma.tenant.findFirst({ where: { slug: 'santiago' } });

        if (!tenantA || !tenantB) {
            console.warn("⚠️ Tenants not found. Please ensure seeds are run.");
            return;
        }

        console.log(`🏢 Tenant A: ${tenantA.name} (${tenantA.id})`);
        console.log(`🏢 Tenant B: ${tenantB.name} (${tenantB.id})`);

        // 2. Create Product in Tenant A
        console.log("🧪 Creating Product 'Pisco Sour' in Tenant A...");
        const productA = await prisma.product.create({
            data: {
                name: "Pisco Sour Verification",
                price: 5000,
                stock: 10,
                tenantId: tenantA.id
            }
        });
        console.log(`✅ Product Created: ${productA.name} (${productA.id})`);

        // 3. Verify Isolation: Tenant B should NOT see it
        console.log("🕵️ Checking if Tenant B can see Product A...");
        const productFromB = await prisma.product.findUnique({
            where: {
                id: productA.id,
                tenantId: tenantB.id // Trying to fetch with Wrong Tenant ID
            }
        });

        if (productFromB) {
            throw new Error("❌ Security Fail: Tenant B accessed Tenant A's product!");
        } else {
            console.log("✅ Security Pass: Tenant B cannot see Product A.");
        }

        // 4. Verify Prisma Extension Logic via manual query simulation
        // The extension logic for update checks 'where.tenantId'. 
        // Let's try to update Product A using Tenant B's ID in the where clause.
        console.log("🕵️ Attempting to update Product A using Tenant B's ID...");
        try {
            await prisma.product.update({
                where: {
                    id: productA.id,
                    tenantId: tenantB.id // This should cause "Record to update not found."
                },
                data: { price: 0 }
            });
            throw new Error("❌ Security Fail: Update succeeded cross-tenant!");
        } catch (e: any) {
            if (e.code === 'P2025') { // Record required but not found
                console.log("✅ Security Pass: Update intercepted. Record not found for Tenant B.");
            } else {
                console.log("⚠️ Unexpected error code:", e.code, e.message);
            }
        }

        // Cleanup
        await prisma.product.delete({ where: { id: productA.id, tenantId: tenantA.id } });
        console.log("🧹 Cleanup successful.");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
    }
}

main();
