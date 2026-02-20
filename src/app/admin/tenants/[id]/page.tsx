import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditTenantForm } from "./EditTenantForm";

export default async function EditTenantPage({ params }: { params: { id: string } }) {
    const tenantId = params.id;

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) {
        notFound();
    }

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
