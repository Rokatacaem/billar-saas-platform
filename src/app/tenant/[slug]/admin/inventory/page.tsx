import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import InventoryClient from "./InventoryClient";

interface InventoryPageProps {
    params: Promise<{ slug: string }>;
}

export default async function InventoryPage({ params }: InventoryPageProps) {
    const { slug } = await params;
    const session = await auth();

    // 🔒 Security Check
    if (!session || session.user.tenantSlug !== slug) {
        redirect('/login');
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/403');
    }

    const tenant = await prisma.tenant.findUnique({
        where: { slug }
    });

    if (!tenant) notFound();

    // Fetch Products (Prisma extension automatically filters by tenantId)
    const products = await prisma.product.findMany({
        where: { tenantId: tenant.id },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
                    <p className="text-sm text-gray-500">Administra los productos y stock de {tenant.name}</p>
                </div>
            </header>

            <InventoryClient initialProducts={products} tenantSlug={slug} />
        </div>
    );
}
