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
            <header className="mb-8 text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white font-black shadow-lg ring-4 ring-white"
                    style={{ backgroundColor: tenant.primaryColor }}
                >
                    {member.name.charAt(0)}
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{member.name}</h1>
                <p className="text-sm text-gray-400 font-medium">{tenant.name} • {slug.toUpperCase()}</p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {member.membershipStatus === 'ACTIVO' ? (
                        <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">
                            Socio Activo
                        </div>
                    ) : (
                        <div className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">
                            Estado: Moroso
                        </div>
                    )}

                    {member.discount > 0 && (
                        <div className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">
                            VIP {member.discount}% OFF
                        </div>
                    )}
                </div>
            </header>

            {/* Member Dossier Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hándicap</span>
                    <div className="text-2xl font-black text-indigo-600">{member.handicap || '0.0'}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Casillero</span>
                    <div className="text-2xl font-black text-emerald-600">{member.lockerNumber || 'N/A'}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sesiones</span>
                    <div className="text-2xl font-black text-gray-800">{totalSessions}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Horas</span>
                    <div className="text-2xl font-black text-gray-800">{totalHours}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Consumo</span>
                    <div className="text-3xl font-black text-gray-900">${totalSpent.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ahorro Real</span>
                    <div className="text-3xl font-black text-indigo-500">${savedAmount.toLocaleString()}</div>
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
