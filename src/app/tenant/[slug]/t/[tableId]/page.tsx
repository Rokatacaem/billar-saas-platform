import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QrClient from "./QrClient";

interface QrPageProps {
    params: Promise<{
        slug: string;
        tableId: string;
    }>;
}

export default async function QrPage({ params }: QrPageProps) {
    const { slug, tableId } = await params;

    const tenant = await prisma.tenant.findUnique({
        where: { slug }
    });

    if (!tenant) notFound();

    const table = await prisma.table.findUnique({
        where: { id: tableId, tenantId: tenant.id }
    });

    if (!table) notFound();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header with Branding */}
            <header className="p-6 text-white text-center shadow-lg" style={{ backgroundColor: tenant.primaryColor }}>
                <h1 className="text-2xl font-bold">{tenant.name}</h1>
                <p className="text-sm opacity-90">Mesa #{table.number}</p>
            </header>

            <main className="flex-1 p-6 flex flex-col items-center gap-6">
                <QrClient
                    tenant={tenant}
                    table={table}
                />
            </main>

            <footer className="p-4 text-center text-xs text-gray-400">
                Powered by Akapoolco
            </footer>
        </div>
    );
}
