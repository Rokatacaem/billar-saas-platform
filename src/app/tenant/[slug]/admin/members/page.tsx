import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import MemberClient from "./MemberClient";
import { getMembers } from "@/app/actions/member-actions";

interface MemberPageProps {
    params: Promise<{ slug: string }>;
}

export default async function MemberPage({ params }: MemberPageProps) {
    const { slug } = await params;
    const session = await auth();

    if (!session || session.user.tenantSlug !== slug) redirect('/login');
    if (session.user.role !== 'ADMIN') redirect('/403');

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) notFound();

    const members = await getMembers();

    // Obtener los planes para la lista desplegable de Nueva Suscripción
    const plans = await prisma.membershipPlan.findMany({
        where: { tenantId: tenant.id },
        orderBy: { price: 'asc' }
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Socios</h1>
                    <p className="text-sm text-gray-500">Administra membresías y descuentos para {tenant.name}</p>
                </div>
            </header>

            <MemberClient initialMembers={members as any} plans={plans as any} />
        </div>
    );
}
