import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Headers Middleware
 * Aplica headers de seguridad OWASP en todas las responses
 */

export function securityHeaders(request: NextRequest, response: NextResponse): NextResponse {
    const headers = new Headers(response.headers);

    // Prevenir clickjacking
    headers.set('X-Frame-Options', 'DENY');

    // Prevenir MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff');

    // Control estricto de referrer
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Forzar HTTPS
    if (process.env.NODE_ENV === 'production') {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Permissions Policy (antes Feature-Policy)
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy (Básico - ajustar según necesidades)
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval para Next.js dev
        "style-src 'self' 'unsafe-inline'", // unsafe-inline para estilos en línea
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'"
    ].join('; ');

    headers.set('Content-Security-Policy', csp);

    // X-Powered-By ya está removido por Next.js por defecto

    return NextResponse.next({
        request,
        headers
    });
}
