// src/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [], // Aquí configurarás tus proveedores (ej. Credentials o Google)
    callbacks: {
        async session({ session, token }) {
            // Inyectamos el tenantId en la sesión para que el filtro automático de Prisma funcione
            if (session.user && token.tenantId) {
                // @ts-ignore - Necesario para extender el tipo User de NextAuth
                session.user.tenantId = token.tenantId;
            }
            return session;
        },
        async jwt({ token, user }) {
            // Al hacer login, pasamos el tenantId del usuario al token
            if (user) {
                // @ts-ignore
                token.tenantId = user.tenantId;
            }
            return token;
        },
    },
    session: { strategy: "jwt" }, // Usamos JWT para facilitar el manejo del tenantId
});