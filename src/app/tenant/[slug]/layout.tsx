import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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
        title: `${tenant.name} - Akapoolco`,
        description: `Bienvenido a la plataforma oficial de ${tenant.name}`,
    };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant) notFound();

    return <>{children}</>;
}