import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    ...authConfig,
    providers: [
        Credentials({
            name: "Dev Login",
            credentials: {
                email: { label: "Email", type: "email" },
            },
            authorize: async (credentials) => {
                console.log("🔒 Authorize called with:", credentials);
                if (!credentials?.email) {
                    console.log("❌ No email provided");
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                    include: { tenant: true } // Fetch tenant to get the slug
                });

                if (!user) {
                    console.log("❌ User not found in DB:", credentials.email);
                    throw new Error("User not found");
                }

                console.log("✅ User found:", user.email, "Tenant:", user.tenantId);

                // Return user with extended properties
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    tenantId: user.tenantId,
                    tenantSlug: user.tenant.slug,
                    role: user.role
                };
            }
        })
    ]
});