// src/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [],
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.tenantId) {
                // Ahora TS reconoce tenantId sin necesidad de @ts-ignore
                session.user.tenantId = token.tenantId as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                // user.tenantId ahora es reconocido por la extensión de tipos
                token.tenantId = user.tenantId;
            }
            return token;
        },
    },
    session: { strategy: "jwt" },
});