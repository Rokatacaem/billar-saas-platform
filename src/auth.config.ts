import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    providers: [], // Agrega providers aquí cuando los necesites (Google, Email, etc.)
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                // Ensure role is ALWAYS passed, regardless of tenant
                session.user.role = token.role as string;

                if (token.tenantId) {
                    session.user.tenantId = token.tenantId as string;
                    session.user.tenantSlug = token.tenantSlug as string;
                    session.user.tenantStatus = token.tenantStatus as string;
                }
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.tenantId = user.tenantId;
                token.tenantSlug = user.tenantSlug;
                token.tenantStatus = user.tenantStatus;
                token.role = user.role;
            }
            return token;
        },
    },
    session: { strategy: "jwt" },
} satisfies NextAuthConfig;
