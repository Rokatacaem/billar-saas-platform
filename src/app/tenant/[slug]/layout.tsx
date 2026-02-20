import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ThemeProvider from "@/components/ui/ThemeProvider";

interface TenantLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

// Generación dinámica de títulos y meta
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant) return { title: "Club no encontrado" };

    return {
        title: `${tenant.name} - Billar SaaS`,
        description: `Bienvenido a la plataforma oficial de ${tenant.name}`,
    };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            businessModel: true,
            primaryColor: true,
            secondaryColor: true,
            settings: true,
            // @ts-expect-error Prisma client is not updated yet with uiConfig
            uiConfig: true,
            logoUrl: true
        }
    });

    if (!tenant) notFound();

    const themeSettings = {
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        backgroundColor: (tenant.settings as any)?.backgroundColor || '#ffffff',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiConfig: tenant.uiConfig as any
    };

    return (
        <ThemeProvider theme={themeSettings}>
            {/* The actual root layout for tenant */}
            <div className="min-h-screen bg-[var(--theme-bg)] text-gray-900 transition-colors duration-300">
                {children}
            </div>
        </ThemeProvider>
    );
}