'use server';

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { detectBruteForce, logSecurityEvent, ThreatLevel } from "@/lib/security/intrusion-detector";
import { validateEmail } from "@/lib/security/sanitizer";

export async function authenticate(prevState: string | undefined, formData: FormData) {
    const email = formData.get('email') as string;

    // 🛡️ SECURITY: Validate email format
    const validEmail = validateEmail(email);
    if (!validEmail) {
        return 'Email inválido.';
    }

    // 🛡️ SECURITY: Check for brute force attempts
    const isBruteForce = await detectBruteForce(validEmail, 'unknown', 5);
    if (isBruteForce) {
        await logSecurityEvent({
            type: 'LOGIN_BLOCKED_BRUTE_FORCE',
            severity: ThreatLevel.HIGH,
            message: `Login blocked due to brute force detection: ${validEmail}`,
            details: { email: validEmail }
        });
        return 'Demasiados intentos fallidos. Intenta más tarde.';
    }

    try {
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirect: true,
            redirectTo: "/"
        });
    } catch (error) {
        // 🚨 IMPORTANT: Re-throw Next.js redirects so they work!
        // Usamos importación dinámica y cast temporal para evitar líos de tipos en versiones bleeding-edge
        const nav = await import("next/navigation") as any;
        if (nav.isRedirectError?.(error) || (error as any)?.message?.includes('NEXT_REDIRECT')) {
            throw error;
        }

        console.error("❌ Login error caught:", error);

        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Error de autenticación: ' + error.message;
            }
        }

        // Return the actual error to the client for debugging (remove in production once fixed)
        return `Error del sistema: ${(error as Error).message}`;
    }

    // 🛡️ SECURITY: Log successful login
    // Note: This code might be unreachable if redirect:true throws, but we keep it for non-redirect flows or if behavior changes.
    // Ideally, success logging happens in the callback or after successful action if redirect methods change.
    // For now, if signIn throws redirect, we miss this log here, but `auth.ts` callbacks can handle it.
    // However, keeping this for completeness in case of future changes.

    /* 
    // Unreachable due to redirect throw, but good to have if we switch to redirect: false
    await logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        severity: ThreatLevel.LOW,
        message: `Successful login for ${validEmail}`,
        details: { email: validEmail }
    });
    */
}
