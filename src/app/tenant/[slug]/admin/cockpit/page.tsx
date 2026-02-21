import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import PosCockpitClient from "./PosCockpitClient";

export default async function CockpitPage({ params }: { params: { slug: string } }) {
    const session = await auth();
    if (!session?.user?.email) redirect('/auth/signin');

    const tenant = await prisma.tenant.findUnique({
        where: { slug: params.slug },
        include: {
            tables: { orderBy: { number: 'asc' } }
        }
    });

    if (!tenant) notFound();

    // Verify Admin Role
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user || (user.tenantId !== tenant.id && user.role !== 'SUPER_ADMIN')) {
        redirect('/'); // Not an admin of this club
    }

    // Get active products for the POS modal
    const products = await prisma.product.findMany({
        where: { tenantId: tenant.id },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="w-full">
            <PosCockpitClient
                tenant={tenant}
                tables={tenant.tables}
                products={products}
            />
        </div>
    );
}
