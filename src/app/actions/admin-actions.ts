'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 💎 Billar Factory Protocol: Atomic Creation
export async function createTenantWithAssets(formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const type = formData.get("type") as "CLUB" | "BUSINESS";
    const primaryColor = formData.get("primaryColor") as string;
    const secondaryColor = formData.get("secondaryColor") as string || "#ffffff";
    const adminName = formData.get("adminName") as string;
    const adminEmail = formData.get("adminEmail") as string;
    const adminPassword = formData.get("adminPassword") as string;

    if (!name || !slug || !adminEmail) {
        throw new Error("Missing required fields");
    }

    try {
        console.log("🏭 Starting Billar Factory for:", name);

        // Transaction: Tenant + Admin User + Assets (Tables)
        await prisma.$transaction(async (tx) => {
            // 1. Create Infrastructure (Tenant)
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    slug: slug.toLowerCase(),
                    type,
                    primaryColor,
                    secondaryColor,
                    baseRate: 100.0, // Default Protocol Rate
                    settings: {
                        welcomeMessage: `Bienvenidos a ${name}`,
                        allowGuestBooking: type === 'CLUB' // Business logic default
                    }
                }
            });

            // 2. Assign Government (Admin User)
            await tx.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    password: adminPassword, // TODO: Hash in production
                    role: 'ADMIN',
                    tenantId: tenant.id
                }
            });

            // 3. Provision Assets (4 Tables Standard)
            for (let i = 1; i <= 4; i++) {
                await tx.table.create({
                    data: {
                        number: i,
                        status: 'AVAILABLE',
                        tenantId: tenant.id
                    }
                });
            }
        });

        console.log("✅ Tenant created successfully!");
    } catch (error) {
        console.error("❌ Factory Error:", error);
        throw new Error("Failed to provision tenant. Slug might be taken.");
    }

    revalidatePath('/admin');
    redirect('/admin');
}
