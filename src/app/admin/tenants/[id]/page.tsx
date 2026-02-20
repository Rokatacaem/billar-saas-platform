import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditTenantForm } from "./EditTenantForm";

export default async function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: tenantId } = await params;

    const tenantRaw = await prisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenantRaw) {
        notFound();
    }

    // 🛡️ SECURITY: Serialize to avoid Date object issues in Client Components
    const tenant = JSON.parse(JSON.stringify(tenantRaw));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Editar Club: {tenant.name}
            </h1>

            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
                <EditTenantForm tenant={tenant} />
            </div>
        </div>
    );
}
