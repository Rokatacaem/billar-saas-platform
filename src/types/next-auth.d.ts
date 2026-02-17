import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            tenantId?: string | null
            tenantSlug?: string | null
            role?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        tenantId?: string | null
        tenantSlug?: string | null
        role?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        tenantId?: string | null
        tenantSlug?: string | null
        role?: string | null
    }
}