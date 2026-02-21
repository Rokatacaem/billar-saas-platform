import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import TenantAdminSidebar from "./TenantAdminSidebar";
import TenantAdminHeader from "./TenantAdminHeader";

// Definimos los tipos de props según Next.js 15
interface AdminLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
    const { slug } = await params;
    const session = await auth();

    // 🛡️ Require Authentication
    if (!session?.user?.email) {
        redirect('/auth/signin');
    }

    const tenant = await prisma.tenant.findUnique({
        where: { slug }
    });

    if (!tenant) notFound();

    // 🛡️ Require Admin Role within this Tenant
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user || (user.tenantId !== tenant.id && user.role !== 'SUPER_ADMIN')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">403</h1>
                    <p className="text-gray-400">No tienes permisos de administrador para este club.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#050811] overflow-hidden selection:bg-indigo-500/30">
            {/* Sidebar Left */}
            <TenantAdminSidebar tenant={tenant} slug={slug} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <TenantAdminHeader tenant={tenant} userName={user.name || 'Admin'} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    {/* Background Ambient Glow */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full -translate-y-1/2"></div>

                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
