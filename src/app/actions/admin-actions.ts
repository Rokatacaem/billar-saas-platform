'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    sanitizeString,
    validateEmail,
    isAlphanumeric,
    validateLength
} from "@/lib/security/sanitizer";
import { hashPassword } from "@/lib/security/encryption";
import { logSecurityEvent, ThreatLevel } from "@/lib/security/intrusion-detector";

import { COUNTRY_PRESETS } from "@/lib/i18n";

// 💎 Billar Factory Protocol: Atomic Creation
export async function createTenantWithAssets(formData: FormData) {
    // 🛡️ SECURITY: Sanitize and validate all inputs
    const rawName = formData.get("name") as string;
    const rawSlug = formData.get("slug") as string;
    const rawAdminName = formData.get("adminName") as string;
    const rawAdminEmail = formData.get("adminEmail") as string;
    const rawAdminPassword = formData.get("adminPassword") as string;
    const type = formData.get("type") as "CLUB" | "BUSINESS";
    const country = formData.get("country") as keyof typeof COUNTRY_PRESETS || "CL";
    const primaryColor = formData.get("primaryColor") as string;
    const secondaryColor = formData.get("secondaryColor") as string || "#ffffff";

    // Validate required fields
    if (!rawName || !rawSlug || !rawAdminEmail || !rawAdminPassword) {
        throw new Error("Missing required fields");
    }

    // Sanitize strings
    const name = sanitizeString(rawName);
    const adminName = rawAdminName ? sanitizeString(rawAdminName) : name;

    // Validate and sanitize slug (must be alphanumeric)
    const slug = rawSlug.toLowerCase().trim();
    if (!isAlphanumeric(slug) || !validateLength(slug, 3, 20)) {
        throw new Error("Slug must be 3-20 alphanumeric characters (a-z, 0-9, -, _)");
    }

    // Validate email
    const adminEmail = validateEmail(rawAdminEmail);
    if (!adminEmail) {
        throw new Error("Invalid email address");
    }

    // Validate password strength
    if (!validateLength(rawAdminPassword, 8, 100)) {
        throw new Error("Password must be between 8-100 characters");
    }

    // Hash password (SECURITY FIX: no more plaintext!)
    const hashedPassword = hashPassword(rawAdminPassword);

    const preset = COUNTRY_PRESETS[country];

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

                    // Localization
                    ...preset,

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
                    password: hashedPassword, // ✅ Hashed password
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

        // 🛡️ SECURITY: Log successful tenant creation
        await logSecurityEvent({
            type: 'TENANT_CREATED',
            severity: ThreatLevel.LOW,
            message: `New tenant created: ${slug}`,
            details: { slug, type, country }
        });
    } catch (error) {
        console.error("❌ Factory Error:", error);

        // 🛡️ SECURITY: Log failed attempt
        await logSecurityEvent({
            type: 'TENANT_CREATION_FAILED',
            severity: ThreatLevel.MEDIUM,
            message: `Failed tenant creation attempt: ${slug}`,
            details: { slug, error: String(error) }
        });

        throw new Error("Failed to provision tenant. Slug might be taken.");
    }

    revalidatePath('/admin');
    redirect('/admin');
}

export async function updateTenantStatus(tenantId: string, status: "ACTIVE" | "SUSPENDED" | "ARCHIVED") {
    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { status }
        });
        revalidatePath('/admin/billing');
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        throw new Error("Failed to update status");
    }
}

export async function updateTenantPlan(tenantId: string, plan: "BASIC" | "PRO" | "ENTERPRISE") {
    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan }
        });
        revalidatePath('/admin/billing');
        return { success: true };
    } catch (error) {
        console.error("Failed to update plan:", error);
        throw new Error("Failed to update plan");
    }
}
