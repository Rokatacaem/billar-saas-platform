import { NextResponse } from 'next/server';
import { prismaBase } from '@/lib/prisma';

export async function GET() {
    console.log("🧪 [DIAGNOSTIC] Starting DB connectivity test...");

    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        env: {
            DATABASE_URL: process.env.DATABASE_URL ? "PRESENT (HIDDEN)" : "MISSING",
            AUTH_SECRET: process.env.AUTH_SECRET ? "PRESENT (HIDDEN)" : "MISSING",
            NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "MISSING (DEFAULTED TO LOCALHOST)",
            NODE_ENV: process.env.NODE_ENV,
        },
        db: {
            status: "PENDING",
        }
    };

    try {
        // Try a simple query
        const userCount = await prismaBase.user.count();
        diagnostics.db = {
            status: "CONNECTED",
            userCount,
        };
    } catch (error) {
        console.error("🔥 [DIAGNOSTIC] DB Connection failed:", error);
        diagnostics.db = {
            status: "FAILED",
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        };
    }

    return NextResponse.json(diagnostics);
}
