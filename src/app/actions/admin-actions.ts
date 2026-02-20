'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    sanitizeString,
    validateEmail,
    validateLength
} from "@/lib/security/sanitizer";
import { hashPassword } from "@/lib/security/encryption";
import { logSecurityEvent, ThreatLevel } from "@/lib/security/intrusion-detector";
import { auth } from "@/auth";

import { COUNTRY_PRESETS } from "@/lib/i18n";

// 💎 Billar Factory Protocol: Atomic Creation
export async function createTenantWithAssets(formData: FormData) {
    // 🛡️ SECURITY: RBAC check (Sentinel Audit)
    const session = await auth();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        console.warn(`🛑 Unauthorized tenant creation attempt by ${session?.user?.email || 'anonymous'}`);
        await logSecurityEvent({
            type: 'UNAUTHORIZED_ADMIN_ACCESS',
            severity: ThreatLevel.CRITICAL,
            message: 'Non-SuperAdmin tried to create a tenant',
            ip: 'Server-Action'
        });
        throw new Error("Acceso denegado: Se requiere rol SUPER_ADMIN");
    }

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
    const backgroundColor = formData.get("backgroundColor") as string || "#ffffff";
    const logoUrl = formData.get("logoUrl") as string || "";
    const plan = (formData.get("plan") as string) || "BASIC";

    // Validate required fields
    if (!rawName || !rawSlug || !rawAdminEmail || !rawAdminPassword) {
        throw new Error("Faltan campos obligatorios");
    }

    // Sanitize strings
    const name = sanitizeString(rawName);
    const adminName = rawAdminName ? sanitizeString(rawAdminName) : name;

    // 🛡️ SENTINEL: Slug Sanitization Audit
    // Must be strictly lowercase, alphanumeric or hyphens
    const slug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

    if (!validateLength(slug, 3, 30)) {
        throw new Error("El slug debe tener entre 3 y 30 caracteres válidos");
    }

    // Validate email
    const adminEmail = validateEmail(rawAdminEmail);
    if (!adminEmail) {
        throw new Error("Email inválido");
    }

    // Validate password strength
    if (!validateLength(rawAdminPassword, 8, 100)) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
    }

    // Hash password
    const hashedPassword = await hashPassword(rawAdminPassword);

    const preset = COUNTRY_PRESETS[country] || COUNTRY_PRESETS["CL"];

    try {
        console.log("🏭 Starting Billar Factory for:", name);

        // Transaction: Tenant + Admin User + Assets (Tables)
        await prisma.$transaction(async (tx) => {
            // Check for duplicate slug
            const existing = await tx.tenant.findUnique({ where: { slug } });
            if (existing) throw new Error(`El slug '${slug}' ya está en uso.`);

            // 1. Create Infrastructure (Tenant)
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    slug,
                    type,
                    primaryColor,
                    secondaryColor,
                    backgroundColor,
                    logoUrl,
                    plan: plan as "BASIC" | "PRO" | "ENTERPRISE",
                    baseRate: 100.0,

                    // Localization
                    currencyCode: preset.currencyCode,
                    currencySymbol: preset.currencySymbol,
                    locale: preset.locale,
                    timezone: preset.timezone,
                    taxRate: preset.taxRate,
                    taxName: preset.taxName,

                    settings: {
                        welcomeMessage: `Bienvenidos a ${name}`,
                        allowGuestBooking: type === 'CLUB'
                    }
                }
            });

            // 2. Assign Government (Admin User)
            await tx.user.create({
                data: {
                    name: adminName,
                    email: adminEmail,
                    password: hashedPassword,
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
            details: { slug, type, country, plan }
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

        throw error;
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
