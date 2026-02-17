import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";

interface MemberHistoryProps {
    params: Promise<{
        slug: string;
        memberId: string;
    }>;
}

export default async function MemberHistoryPage({ params }: MemberHistoryProps) {
    const { slug, memberId } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) notFound();

    const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: {
            usageLogs: {
                where: { endedAt: { not: null } },
                orderBy: { startedAt: 'desc' },
                take: 20
            }
        }
    });

    if (!member || member.tenantId !== tenant.id) notFound();

    // Calculate Stats
    const totalSessions = member.usageLogs.length;
    const totalSpent = member.usageLogs.reduce((sum, log) => sum + log.amountCharged, 0);
    const totalMinutes = member.usageLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    const savedAmount = member.usageLogs.reduce((sum, log) => sum + (log.discountApplied || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <header className="mb-8 text-center">
                <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl text-white font-bold shadow-md"
                    style={{ backgroundColor: tenant.primaryColor }}
                >
                    {member.name.charAt(0)}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
                <p className="text-sm text-gray-500">Miembro de {tenant.name}</p>
                {member.discount > 0 && (
                    <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                        {member.discount}% Descuento VIP
                    </div>
                )}
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                    <div className="text-3xl font-bold text-indigo-600">{totalHours}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Horas Jugadas</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                    <div className="text-3xl font-bold text-green-600">${totalSpent.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Total Gastado</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm text-center col-span-2">
                    <div className="text-xl font-bold text-blue-600">${savedAmount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Ahorrado con Membresía</div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4">Historial Reciente</h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {member.usageLogs.map((log) => (
                        <li key={log.id} className="p-4 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-gray-900">Mesa desconocida</div> {/* Relation to table not included but acceptable for MVP */}
                                <div className="text-xs text-gray-500">{format(log.startedAt, 'dd/MM/yyyy HH:mm')}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">${log.amountCharged}</div>
                                <div className="text-xs text-gray-500">{log.durationMinutes} min</div>
                            </div>
                        </li>
                    ))}
                    {member.usageLogs.length === 0 && (
                        <li className="p-6 text-center text-gray-500 italic">No hay historial disponible.</li>
                    )}
                </ul>
            </div>

            <footer className="mt-8 text-center">
                <a href={`/tenant/${slug}`} className="text-indigo-600 text-sm font-semibold hover:underline">
                    ← Volver al Club
                </a>
            </footer>
        </div>
    );
}
