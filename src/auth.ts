import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prismaBase } from "@/lib/prisma"; // Use Base client to avoid circular loop
import { authConfig } from "./auth.config";
import {
    verifyPassword,
    verifyPasswordLegacy,
    isLegacyHash,
    hashPassword
} from "@/lib/security/encryption";

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    adapter: PrismaAdapter(prismaBase),
    ...authConfig,
    providers: [
        Credentials({
            name: "Dev Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                try {
                    console.log("🔒 Authorize called");
                    if (!credentials?.email || !credentials?.password) {
                        console.log("❌ Missing credentials");
                        return null;
                    }

                    const user = await prismaBase.user.findUnique({
                        where: { email: credentials.email as string },
                        include: { tenant: true }
                    });

                    if (!user || !user.password) {
                        console.log("❌ User not found or no password set");
                        return null;
                    }

                    let isValidPassword = false;

                    // 🔐 LAZY MIGRATION LOGIC
                    if (isLegacyHash(user.password)) {
                        console.log("🔄 Legacy SHA-256 hash detected, verifying...");
                        isValidPassword = verifyPasswordLegacy(
                            credentials.password as string,
                            user.password
                        );

                        // ✅ Si el password es correcto, migrar a bcrypt
                        if (isValidPassword) {
                            console.log("✅ Password valid. Migrating to bcrypt...");
                            try {
                                const newHash = await hashPassword(credentials.password as string);

                                await prismaBase.user.update({
                                    where: { id: user.id },
                                    data: { password: newHash }
                                });

                                console.log("🎉 Password successfully migrated to bcrypt!");
                            } catch (migrationError) {
                                console.error("⚠️ Password migration failed:", migrationError);
                                // Continue login even if migration fails
                            }
                        }
                    } else {
                        // Password ya está en bcrypt
                        isValidPassword = await verifyPassword(
                            credentials.password as string,
                            user.password
                        );
                    }

                    if (!isValidPassword) {
                        console.log("❌ Invalid password");
                        return null;
                    }

                    console.log("✅ User authenticated:", user.email);

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        tenantId: user.tenantId,
                        tenantSlug: user.tenant.slug,
                        tenantStatus: user.tenant.status,
                        role: user.role
                    };
                } catch (error) {
                    console.error("🔥 CRITICAL ERROR in authorize:", error);
                    return null;
                }
            }
        })
    ]
});