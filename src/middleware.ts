import { auth } from "@/auth.edge";
import { NextResponse } from "next/server";
import { apiLimiter, checkRateLimit, getClientIP } from "@/lib/security/rate-limiter";
import { logSecurityEventEdge, ThreatLevel, detectTenantViolationEdge } from "@/lib/security/edge-logger";

export default auth(async (req) => {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";
    const clientIP = getClientIP(req);

    // Define tu dominio raíz (ej. localhost:3000 o tuapp.cl)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    const subdominio = hostname.replace(`.${rootDomain}`, "");

    const isTenantRoute = subdominio !== hostname && subdominio !== "www";
    const session = req.auth;

    // 🛡️ SECURITY: Global rate limiting
    const rateLimitKey = `global:${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey, apiLimiter);

    if (!rateLimit.allowed) {
        await logSecurityEventEdge({
            type: 'RATE_LIMIT_EXCEEDED',
            severity: ThreatLevel.MEDIUM,
            message: `Global rate limit exceeded from IP ${clientIP}`,
            details: { path: url.pathname, retryAfter: rateLimit.retryAfter },
            ip: clientIP
        });

        const response = NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: { 'Retry-After': String(rateLimit.retryAfter || 60) }
            }
        );
        return applySecurityHeaders(response);
    }

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

                // 2. Tenant Isolation & Status Check
                const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

                if (session.user.tenantSlug !== subdominio.toLowerCase() && !isSuperAdmin) {
                    console.warn(`🚨 Isolation Alert: User ${session.user.email} (Tenant: ${session.user.tenantSlug}) -> ${subdominio}`);

                    // 🛡️ SECURITY: Log tenant isolation violation
                    await detectTenantViolationEdge(
                        session.user.id || 'unknown',
                        session.user.tenantId || 'unknown',
                        subdominio,
                        clientIP
                    );

                    const response = NextResponse.rewrite(new URL('/403', req.url));
                    return applySecurityHeaders(response);
                }

                // ⛔ SUSPENSION CHECK
                if ((session.user as any).tenantStatus === 'SUSPENDED' && !isSuperAdmin) {
                    console.warn(`⛔ Suspended Tenant Access Attempt: ${session.user.tenantSlug}`);
                    return NextResponse.rewrite(new URL('/suspended', req.url));
                }

                // 3. Role Based Access Control (RBAC)
                const userRole = session.user.role;
                if (url.pathname.startsWith('/admin') && userRole !== 'ADMIN' && !isSuperAdmin) {
                    console.warn(`🚫 Access Denied: Role ${userRole} tried to access Admin area.`);

                    // 🛡️ SECURITY: Log unauthorized admin access attempt
                    await logSecurityEventEdge({
                        type: 'UNAUTHORIZED_ADMIN_ACCESS',
                        severity: ThreatLevel.HIGH,
                        message: `User with role ${userRole} attempted to access admin area`,
                        details: {
                            userId: session.user.id,
                            role: userRole,
                            path: url.pathname
                        },
                        ip: clientIP,
                        userId: session.user.id || undefined,
                        tenantId: session.user.tenantId || undefined
                    });

                    const response = NextResponse.rewrite(new URL('/403', req.url));
                    return applySecurityHeaders(response);
                }
            }
        }
    }

    console.log(`Middleware Debug: Host=${hostname}, Sub=${subdominio}, Path=${url.pathname}, User=${session?.user?.email}`);

    // Si detectamos un subdominio que no sea 'www', hacemos el rewrite interno
    if (isTenantRoute && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/static')) {
        const response = NextResponse.rewrite(
            new URL(`/tenant/${subdominio}${url.pathname}`, req.url)
        );
        return applySecurityHeaders(response);
    }

    const response = NextResponse.next();
    return applySecurityHeaders(response);
});

/**
 * 🛡️ SECURITY: Apply security headers to all responses
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
    const headers = new Headers(response.headers);

    // Prevenir clickjacking
    headers.set('X-Frame-Options', 'DENY');

    // Prevenir MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff');

    // Control estricto de referrer
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Forzar HTTPS en producción
    if (process.env.NODE_ENV === 'production') {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Permissions Policy
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval para Next.js dev
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'"
    ].join('; ');

    headers.set('Content-Security-Policy', csp);

    return NextResponse.next({
        request: { headers: new Headers(response.headers) },
        headers
    });
}

export const config = {
    matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};