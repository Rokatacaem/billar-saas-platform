import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LeadsClient from "./LeadsClient";

export default async function LeadsPage() {
    const session = await auth();

    // 🛡️ SECURITY: Solo SUPER_ADMIN puede acceder
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        redirect('/');
    }

    // Fetch all leads with sorting
    const leads = await prisma.lead.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm">
                    <h1 className="text-3xl font-bold text-green-900 dark:text-green-400 mb-2">Lead Management</h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">Gestión de prospectos internacionales</p>
                </header>

                <LeadsClient leads={leads} />
            </div>
        </div>
    );
}
