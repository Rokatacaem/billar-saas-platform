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
        <div className="leads-page">
            <div className="container">
                <header className="page-header">
                    <h1>Lead Management</h1>
                    <p>Gestión de prospectos internacionales</p>
                </header>

                <LeadsClient leads={leads} />
            </div>

            <style jsx>{`
                .leads-page {
                    min-height: 100vh;
                    background: #f5f5f5;
                    padding: 2rem 0;
                }

                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                .page-header {
                    margin-bottom: 2rem;
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }

                .page-header h1 {
                    margin: 0 0 0.5rem 0;
                    color: #1a4d2e;
                    font-size: 2rem;
                }

                .page-header p {
                    margin: 0;
                    color: #666;
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
}
