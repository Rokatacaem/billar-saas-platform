import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import LoginForm from './LoginForm';

export default async function LoginPage() {
    // Determine the host and subdomain to render White-Label or Dev Mode
    const headersList = await headers();
    const host = headersList.get('host') || '';

    // Extracción robusta del subdominio (alineado con middleware.ts)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    let subdomain = '';

    if (host.endsWith(rootDomain)) {
        subdomain = host.replace(`.${rootDomain}`, '').replace(rootDomain, '');
    } else if (host.endsWith('.vercel.app')) {
        const parts = host.split('.');
        if (parts.length > 3) subdomain = parts[0];
    }

    let tenantName, logoUrl, primaryColor, bgColor = '#f3f4f6'; // bg-gray-100 default

    if (subdomain && subdomain !== 'www') {
        const tenant = await prisma.tenant.findUnique({
            where: { slug: subdomain },
            // @ts-expect-error Prisma Client generation pending for uiConfig
            select: { name: true, logoUrl: true, primaryColor: true, uiConfig: true }
        });

        if (tenant) {
            tenantName = tenant.name;
            logoUrl = tenant.logoUrl;
            primaryColor = tenant.primaryColor;
            // Extract the background from JSON safely
            // @ts-expect-error Prisma config
            bgColor = tenant.uiConfig?.backgroundColor || '#ffffff';
        }
    }

    // Renderiza una interfaz base dinámica que alberga el formulario 100% aislado
    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center p-4 transition-colors duration-500"
            style={{ backgroundColor: bgColor }}
        >
            <LoginForm
                tenantName={tenantName}
                logoUrl={logoUrl || undefined}
                primaryColor={primaryColor || undefined}
            />
        </div>
    );
}
