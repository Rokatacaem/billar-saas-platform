import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import ComercialDashboardClient from "./ComercialDashboardClient";

export default async function ComercialDashboardPage({ params }: { params: { slug: string } }) {
    const session = await auth();
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

    // 💼 Verify this tenant uses COMERCIAL model
    if (tenant.businessModel !== 'COMERCIAL') {
        redirect(`/tenant/${params.slug}/admin/dashboard-club`);
    }

    return <ComercialDashboardClient tenant={tenant} />;
}
