# Core Security Kit

## \ud83d\udee1\ufe0f Overview

El **Core Security Kit** es una biblioteca modular y reutilizable de componentes de seguridad que implementa protecciones OWASP Top 10 para aplicaciones Next.js con arquitectura multi-tenant.

## \ud83c\udfaf Features

- **Input Sanitization**: Protección contra XSS, SQL Injection, y ataques de inyección
- **Rate Limiting**: Prevención de DoS y Brute Force attacks
- **Encryption**: AES-256-GCM para datos sensibles
- **Intrusion Detection**: Sistema de logging y alertas de actividad sospechosa
- **Security Headers**: Configuración OWASP-compliant de headers HTTP

## \ud83d\udcda Componentes

### 1. Sanitizer (`sanitizer.ts`)

Sanitización y validación de inputs del usuario.

**Funciones principales:**

```typescript
import { sanitizeString, validateEmail, isAlphanumeric } from '@/lib/security/sanitizer';

// Limpiar strings de caracteres peligrosos
const clean = sanitizeString(userInput);

// Validar y normalizar emails
const email = validateEmail('user@example.com');

// Validar formato alfanumérico (slugs, IDs)
if (isAlphanumeric(slug)) {
    // Proceso seguro
}
```

**Uso en Server Actions:**

```typescript
'use server';
import { sanitizeString, validateEmail } from '@/lib/security/sanitizer';

export async function createUser(formData: FormData) {
    const rawName = formData.get('name') as string;
    const rawEmail = formData.get('email') as string;
    
    // Sanitizar
    const name = sanitizeString(rawName);
    const email = validateEmail(rawEmail);
    
    if (!email) {
        throw new Error('Invalid email');
    }
    
    // Proceso DB con datos limpios
}
```

---

### 2. Rate Limiter (`rate-limiter.ts`)

Protección contra abuso de endpoints.

**Uso en API Routes:**

```typescript
import { checkRateLimit, apiLimiter, getClientIP } from '@/lib/security/rate-limiter';

export async function POST(request: Request) {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`api:${ip}`, apiLimiter);
    
    if (!rateLimit.allowed) {
        return Response.json(
            { error: 'Too many requests' },
            { 
                status: 429,
                headers: { 'Retry-After': String(rateLimit.retryAfter) }
            }
        );
    }
    
    // Procesamiento normal
}
```

**Limiters predefinidos:**

- `loginLimiter`: 5 intentos/minuto
- `apiLimiter`: 100 requests/minuto
- `paymentLimiter`: 10 requests/minuto

**Crear limiter custom:**

```typescript
import { RateLimiter } from '@/lib/security/rate-limiter';

const customLimiter = new RateLimiter(300000, 50); // 50 requests cada 5 minutos
```

---

### 3. Encryption (`encryption.ts`)

Encriptación de datos sensibles con AES-256-GCM.

**Encriptar/Desencriptar:**

```typescript
import { encrypt, decrypt } from '@/lib/security/encryption';

// Encriptar
const encrypted = encrypt('sensitive-data');
// Almacenar en DB

// Desencriptar
const plaintext = decrypt(encrypted);
```

**Hash de Passwords:**

```typescript
import { hashPassword } from '@/lib/security/encryption';

const hashed = hashPassword(userPassword);
// Almacenar hash en DB (no plaintext!)
```

> [!WARNING]
> **Producción**: Reemplazar `hashPassword` con bcrypt:
>
> ```bash
> npm install bcryptjs
> ```
>
> ```typescript
> import bcrypt from 'bcryptjs';
> const hash = await bcrypt.hash(password, 10);
> ```

---

### 4. Intrusion Detector (`intrusion-detector.ts`)

Sistema de logging y alertas de eventos de seguridad.

**Logging de eventos:**

```typescript
import { logSecurityEvent, ThreatLevel } from '@/lib/security/intrusion-detector';

await logSecurityEvent({
    type: 'UNAUTHORIZED_ACCESS',
    severity: ThreatLevel.HIGH,
    message: 'User attempted admin access without permissions',
    details: { userId, role, path },
    ip: clientIP,
    userId,
    tenantId
});
```

**Detección de Brute Force:**

```typescript
import { detectBruteForce } from '@/lib/security/intrusion-detector';

const isBruteForce = await detectBruteForce(email, ip, 5);
if (isBruteForce) {
    // Bloquear intento
}
```

**Detectar violaciones de tenant:**

```typescript
import { detectTenantViolation } from '@/lib/security/intrusion-detector';

await detectTenantViolation(userId, userTenantId, attemptedTenantId, ip);
```

---

### 5. Security Headers (`security-headers.ts`)

Headers HTTP según OWASP.

**Aplicar en middleware:**

```typescript
import { NextResponse } from 'next/server';

function applySecurityHeaders(response: NextResponse) {
    const headers = new Headers(response.headers);
    
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Security-Policy', "default-src 'self'");
    
    return NextResponse.next({ headers });
}
```

---

## \ud83d\ude80 Migración a Otros Proyectos

### 1. Copiar la carpeta security

```bash
cp -r src/lib/security /path/to/new-project/src/lib/
```

### 2. Instalar dependencias

```bash
npm install validator
npm install --save-dev @types/validator
```

### 3. Configurar variables de entorno

Crear `.env` con:

```env
ENCRYPTION_KEY="<openssl rand -hex 32>"
DATABASE_URL="postgresql://..."
```

### 4. Integrar en middleware

```typescript
// src/middleware.ts
import { apiLimiter, checkRateLimit } from '@/lib/security/rate-limiter';
import { logSecurityEvent } from '@/lib/security/intrusion-detector';

export function middleware(request: NextRequest) {
    const ip = request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`global:${ip}`, apiLimiter);
    
    if (!rateLimit.allowed) {
        // Block request
    }
    
    // Aplicar security headers
    const response = NextResponse.next();
    return applySecurityHeaders(response);
}
```

### 5. Usar en Server Actions

```typescript
'use server';
import { sanitizeString, validateEmail } from '@/lib/security/sanitizer';
import { hashPassword } from '@/lib/security/encryption';

export async function createAccount(formData: FormData) {
    const name = sanitizeString(formData.get('name') as string);
    const email = validateEmail(formData.get('email') as string);
    const password = hashPassword(formData.get('password') as string);
    
    // Guardar en DB
}
```

---

## \ud83e\uddea Tests de Seguridad

### Cross-Tenant Isolation

```bash
npx tsx scripts/cross-tenant-test.ts
```

### Secrets Scanner

```bash
npx tsx scripts/secrets-scanner.ts
```

---

## \u2705 Checklist de Integración

- [ ] Copiar `src/lib/security` al nuevo proyecto
- [ ] Instalar `validator` y `@types/validator`
- [ ] Configurar `ENCRYPTION_KEY` en `.env`
- [ ] Integrar sanitización en Server Actions
- [ ] Integrar rate limiting en middleware
- [ ] Aplicar security headers en todas las responses
- [ ] Agregar logging de eventos de seguridad
- [ ] Ejecutar tests de cross-tenant (si aplica)
- [ ] Ejecutar secrets scanner
- [ ] Rotar secretos en producción cada 90 días

---

## \ud83d\udd12 Seguridad en Producción

> [!CAUTION]
> **Antes de deploy:**
>
> 1. Rotar `AUTH_SECRET`: `openssl rand -base64 32`
> 2. Generar `ENCRYPTION_KEY`: `openssl rand -hex 32`
> 3. Ejecutar secrets scanner
> 4. Configurar RLS en base de datos
> 5. Habilitar HTTPS/TLS
> 6. Configurar WAF (Web Application Firewall)

---

## \ud83d\udcca KPIs de Seguridad

**Métricas a monitorear:**

- Intentos de login fallidos/hora
- Eventos de nivel HIGH/CRITICAL en SystemLog
- IPs bloqueadas por rate limiting
- Violaciones de aislamiento multi-tenant
- Tiempo promedio de detección de intrusiones

---

## \ud83d\udcde Soporte

Para migrar este kit a **AutoLink** u otros proyectos, seguir la guía de migración paso a paso.

**Developed by**: Rodrigo con Antigravity AI
**Version**: 1.0.0 (Sentinel)
**License**: Propietario
