import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TenantDashboard from "./TenantDashboard";
import { auth } from "@/auth";

interface TenantPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
    const { slug } = await params;
    const session = await auth();

    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        include: {
            tables: { orderBy: { number: 'asc' } }
        }
    });

    if (!tenant) {
        notFound();
    }

    const products = await prisma.product.findMany({
        where: { tenantId: tenant.id },
        orderBy: { name: 'asc' }
    });

    const userRole = session?.user?.role || 'GUEST';

    return (
        <div className="min-h-screen flex flex-col items-center p-8 bg-gray-50 text-gray-900 font-sans">
            <header className="w-full max-w-4xl flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md text-white font-bold"
                        style={{ backgroundColor: tenant.primaryColor }}
                    >
                        {tenant.name.charAt(0)}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                        {tenant.type}
                    </div>
                    {session?.user && (
                        <div className={`px-3 py-1 text-xs font-bold rounded-full text-white uppercase ${userRole === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-500'}`}>
                            {userRole}
                        </div>
                    )}
                </div>
            </header>

            <main className="w-full max-w-4xl">
                <TenantDashboard
                    tenant={tenant}
                    tables={tenant.tables}
                    products={products}
                    role={userRole}
                />
            </main>

            <footer className="mt-20 text-xs text-gray-400">
                Powered by Billar SaaS Platform
            </footer>
        </div>
    );
}
