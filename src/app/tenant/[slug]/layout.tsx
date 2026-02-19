import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { generateTenantTheme } from "@/lib/theme-generator";

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
            secondaryColor: true, // Agregado para el tema
            settings: true,
            logoUrl: true
        }
    });

    if (!tenant) notFound();

    const themeSettings = {
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        backgroundColor: (tenant.settings as any)?.backgroundColor || '#ffffff',
        businessModel: tenant.businessModel as any
    };

    const theme = generateTenantTheme(themeSettings);

    return (
        <ThemeProvider businessModel={tenant.businessModel}>
            <div style={theme as React.CSSProperties} className="min-h-screen bg-background text-foreground transition-colors duration-300">
                {children}
            </div>
        </ThemeProvider>
    );
}