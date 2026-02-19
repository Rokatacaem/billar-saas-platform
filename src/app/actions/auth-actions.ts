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
            console.log("🚀 [AUTH-ACTION] Calling signIn with redirect: false");
            const result = await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                redirect: false,
            });

            console.log("✅ [AUTH-ACTION] signIn finished, result:", result);
        } catch (error) {
            console.error("❌ [AUTH-ACTION] Unexpected error in Server Action:", error);
            if (error instanceof AuthError) {
                switch (error.type) {
                    case 'CredentialsSignin':
                        return 'Credenciales inválidas.';
                    default:
                        return `Error de autenticación: ${error.message || error.type}`;
                }
            }
            return `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`;
        }

        // Si llegamos aquí, la sesión debería estar creada. Redirigimos manualmente.
        console.log("🏁 [AUTH-ACTION] Redirecting manually to /");
        const { redirect } = await import("next/navigation");
        redirect("/");

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
