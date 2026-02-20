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
        console.log("🚀 [AUTH-ACTION] Calling signIn with redirect: false");
        const result = await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirect: false,
        });

        console.log("✅ [AUTH-ACTION] signIn finished, result:", result);
    } catch (error) {
        if (error instanceof AuthError) {
            console.error("❌ [AUTH-ACTION] AuthError:", error.type, error.message);
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return `Error de autenticación: ${error.message || error.type}`;
            }
        }

        console.error("❌ [AUTH-ACTION] Unexpected error in Server Action:", error);
        return `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }

    // Si llegamos aquí, la sesión debería estar creada. Redirigimos manualmente.
    console.log("🏁 [AUTH-ACTION] Redirecting manually to /");
    const { redirect } = await import("next/navigation");
    redirect("/");
}
