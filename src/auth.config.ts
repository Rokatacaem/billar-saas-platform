import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    providers: [], // Agrega providers aquí cuando los necesites (Google, Email, etc.)
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.tenantId) {
                session.user.tenantId = token.tenantId as string;
                session.user.tenantSlug = token.tenantSlug as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.tenantId = user.tenantId;
                token.tenantSlug = user.tenantSlug;
                token.role = user.role;
            }
            return token;
        },
    },
    session: { strategy: "jwt" },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
