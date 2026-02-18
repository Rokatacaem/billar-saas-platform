import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ClubDashboardClient from "./ClubDashboardClient";

export default async function ClubDashboardPage({ params }: { params: { slug: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect('/auth/signin');

    const tenant = await prisma.tenant.findUnique({
        where: { slug: params.slug }
    });

    if (!tenant) notFound();

    // 🛡️ RBAC: Only ADMIN can access dashboards
    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { tenant: true }
    });

    if (!user || user.tenantId !== tenant.id || user.role !== 'ADMIN') {
        return <div className="p-8 text-red-600">⛔ Acceso denegado. Solo administradores.</div>;
    }

    // 🏛️ Verify this tenant uses CLUB_SOCIOS model
    if (tenant.businessModel !== 'CLUB_SOCIOS') {
        redirect(`/tenant/${params.slug}/admin/dashboard-comercial`);
    }

    return <ClubDashboardClient tenant={tenant} />;
}
