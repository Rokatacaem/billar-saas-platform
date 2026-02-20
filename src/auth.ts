import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import {
    verifyPassword,
    verifyPasswordLegacy,
    isLegacyHash,
    hashPassword
} from "@/lib/security/encryption";

import { prismaClientSingleton } from "@/lib/prisma-factory";

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prismaBase = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prismaBase;

// 🔍 DIAGNÓSTICO: Verificar secretos en Vercel
if (!process.env.AUTH_SECRET) {
    console.error("🔥 [AUTH] CRITICAL: AUTH_SECRET is missing in environment variables!");
} else {
    console.log("🛡️ [AUTH] AUTH_SECRET is present");
}

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
                    console.log("🔒 [AUTH] Authorize start for:", credentials?.email);
                    if (!credentials?.email || !credentials?.password) {
                        console.log("❌ [AUTH] Missing credentials");
                        return null;
                    }

                    console.log("📡 [AUTH] Fetching user from DB...");
                    const user = await prismaBase.user.findUnique({
                        where: { email: credentials.email as string },
                        include: { tenant: true }
                    });

                    if (!user || !user.password) {
                        console.log("❌ [AUTH] User not found or no password set:", credentials.email);
                        return null;
                    }

                    console.log("🔑 [AUTH] Verifying password...");
                    let isValidPassword = false;

                    // 🔐 LAZY MIGRATION LOGIC
                    if (isLegacyHash(user.password)) {
                        console.log("🔄 [AUTH] Legacy SHA-256 hash detected");
                        isValidPassword = verifyPasswordLegacy(
                            credentials.password as string,
                            user.password
                        );

                        if (isValidPassword) {
                            console.log("✅ [AUTH] Password valid. Migrating...");
                            try {
                                const newHash = await hashPassword(credentials.password as string);
                                await prismaBase.user.update({
                                    where: { id: user.id },
                                    data: { password: newHash }
                                });
                                console.log("🎉 [AUTH] Password migrated!");
                            } catch (migrationError) {
                                console.error("⚠️ [AUTH] Migration failed:", migrationError);
                            }
                        }
                    } else {
                        isValidPassword = await verifyPassword(
                            credentials.password as string,
                            user.password
                        );
                    }

                    if (!isValidPassword) {
                        console.log("❌ [AUTH] Invalid password for:", user.email);
                        return null;
                    }

                    console.log("✅ [AUTH] Success:", user.email, "Tenant:", user.tenant.slug);

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
                    console.error("🔥 [AUTH] CRITICAL ERROR in authorize:", error);
                    // Importante: No re-lanzar aquí para que NextAuth maneje el error como fallo de auth
                    return null;
                }
            }
        })
    ]
});