// src/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";
    // Define tu dominio raíz (ej. localhost:3000 o tuapp.cl)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    const subdominio = hostname.replace(`.${rootDomain}`, "");

    const isTenantRoute = subdominio !== hostname && subdominio !== "www";
    const session = req.auth;

    // 🔒 Security & RBAC Logic
    if (isTenantRoute) {
        // Exclude Public Paths and API
        if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next') && !url.pathname.startsWith('/static')) {

            // Protected Routes: /admin/*, /pos/*
            // We also might want to protect /dashboard or the root of the app if it's private?
            // User requirement: Protect /tenant/[slug]/admin/* and /tenant/[slug]/pos/*
            // Since we rewrite to /tenant/[slug]/..., the Incoming path is just /admin or /pos

            const isProtectedRoute = url.pathname.startsWith('/admin') || url.pathname.startsWith('/pos');

            if (isProtectedRoute) {
                // 1. Authentication Check
                if (!session) {
                    console.log(`⛔ Unauthenticated access to ${url.pathname}. Redirecting to login.`);
                    const loginUrl = new URL('/login', req.url);
                    loginUrl.searchParams.set('callbackUrl', req.url); // Return to original page
                    return NextResponse.redirect(loginUrl);
                }

                // 2. Tenant Isolation (Identity Shield)
                if (session.user.tenantSlug !== subdominio.toLowerCase()) {
                    console.warn(`🚨 Security Alert: User ${session.user.email} (Tenant: ${session.user.tenantSlug}) tried to access ${subdominio}`);
                    // Return 403 Forbidden or Redirect to their own dashboard?
                    // Requirement: Deny access.
                    // We can rewrite to a 403 page or just return a text response for now.
                    // Better UX: Redirect home or show error.
                    // Let's return a JSON error/rewrite to a 403 page if we had one.
                    // For now, NextResponse.rewrite to a 403 path (simulate) or just throw error?
                    // Next.js middleware doesn't strictly support "sending HTML" easily without rewrite.
                    // Let's rewrite to a standard /403 page (we should probably create one, but for now / is safer)
                    return NextResponse.rewrite(new URL('/403', req.url));
                }

                // 3. Role Based Access Control (RBAC)
                const userRole = session.user.role;
                if (url.pathname.startsWith('/admin') && userRole !== 'ADMIN') {
                    console.warn(`🚫 Access Denied: Role ${userRole} tried to access Admin area.`);
                    return NextResponse.rewrite(new URL('/403', req.url));
                }
            }
        }
    }

    console.log(`Middleware Debug: Host=${hostname}, Sub=${subdominio}, Path=${url.pathname}, User=${session?.user?.email}`);

    // Si detectamos un subdominio que no sea 'www', hacemos el rewrite interno
    if (isTenantRoute && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/static')) {
        return NextResponse.rewrite(
            new URL(`/tenant/${subdominio}${url.pathname}`, req.url)
        );
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};