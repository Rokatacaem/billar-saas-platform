/**
 * Core Security - Rate Limiter
 * Protección contra DoS y Brute Force
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private store: Map<string, RateLimitEntry>;
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 100) {
        this.store = new Map();
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        // ⚠️ setInterval no es compatible con Edge Runtime.
        // Se reemplaza por limpieza "lazy" en el método check().
    }

    /**
     * Verifica si una key ha excedido el límite
     * @param key - Identificador (IP, tenantId, email)
     * @returns true si está dentro del límite
     */
    check(key: string): boolean {
        // 🧹 Limpieza Lazy: 1% de probabilidad de ejecutar cleanup en cada check
        if (Math.random() < 0.01) {
            this.cleanup();
        }

        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now > entry.resetTime) {
            // Reset o primer acceso
            this.store.set(key, {
                count: 1,
                resetTime: now + this.windowMs
            });
            return true;
        }

        if (entry.count >= this.maxRequests) {
            return false; // Límite excedido
        }

        entry.count++;
        this.store.set(key, entry);
        return true;
    }

    /**
     * Obtiene el tiempo restante para reset (en segundos)
     */
    getTimeUntilReset(key: string): number {
        const entry = this.store.get(key);
        if (!entry) return 0;

        const remaining = Math.ceil((entry.resetTime - Date.now()) / 1000);
        return Math.max(0, remaining);
    }

    /**
     * Limpia entradas expiradas
     */
    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Reset manual de una key
     */
    reset(key: string) {
        this.store.delete(key);
    }
}

// Instancias predefinidas
export const loginLimiter = new RateLimiter(60000, 5); // 5 intentos por minuto
export const apiLimiter = new RateLimiter(60000, 100); // 100 requests por minuto
export const paymentLimiter = new RateLimiter(60000, 10); // 10 pagos por minuto

/**
 * Helper para obtener IP del request
 */
export function getClientIP(request: Request): string {
    // Obtener IP real considerando proxies
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    if (realIP) {
        return realIP;
    }

    // Fallback (no debería llegar aquí en producción)
    return 'unknown';
}

/**
 * Middleware helper para Next.js
 */
export function checkRateLimit(
    key: string,
    limiter: RateLimiter = apiLimiter
): { allowed: boolean; retryAfter?: number } {
    const allowed = limiter.check(key);

    if (!allowed) {
        return {
            allowed: false,
            retryAfter: limiter.getTimeUntilReset(key)
        };
    }

    return { allowed: true };
}
