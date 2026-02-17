import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FinancePageProps {
    params: Promise<{ slug: string }>;
}

export default async function FinancePage({ params }: FinancePageProps) {
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
        where: { slug }
    });

    if (!tenant) return <div>Tenant no encontrado</div>;

    // Fetch recent logs with payments
    const logs = await prisma.usageLog.findMany({
        where: {
            tenantId: tenant.id,
            OR: [
                { paymentStatus: 'PAID' },
                { paymentRecords: { some: {} } }
            ]
        },
        include: {
            table: true,
            member: true,
            paymentRecords: true,
            items: true
        },
        orderBy: { endedAt: 'desc' },
        take: 50
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Conciliación Financiera</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-semibold border-b">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Mesa</th>
                            <th className="p-4">Detalle</th>
                            <th className="p-4 text-right">Monto Total</th>
                            <th className="p-4">Método</th>
                            <th className="p-4">Estado Sistema</th>
                            <th className="p-4">Estado Pago</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => {
                            const payment = log.paymentRecords[0]; // Assume 1 payment for MVP
                            const isDiscrepancy = (log.paymentStatus === 'PAID' && !payment) || (payment && payment.amount !== log.amountCharged);

                            return (
                                <tr key={log.id} className={`hover:bg-gray-50 ${isDiscrepancy ? 'bg-red-50' : ''}`}>
                                    <td className="p-4">
                                        {format(log.endedAt || log.createdAt, 'dd MMM HH:mm', { locale: es })}
                                    </td>
                                    <td className="p-4">Mesa {log.table.number}</td>
                                    <td className="p-4">
                                        <div>{log.durationMinutes} min juego</div>
                                        <div className="text-xs text-gray-400">{log.items.length} productos</div>
                                        {log.member && <div className="text-xs text-indigo-600">Socio: {log.member.name}</div>}
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">
                                        ${log.amountCharged.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        {payment ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                                {payment.method === 'CARD' ? '💳 Tarjeta' : '💵 Efectivo'}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {log.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {payment?.status === 'COMPLETED' ? (
                                            <span className="text-green-600 font-medium">Confirmado</span>
                                        ) : (
                                            <span className="text-gray-400">Pendiente</span>
                                        )}
                                        {isDiscrepancy && (
                                            <div className="text-xs text-red-600 font-bold mt-1">⚠️ Discrepancia</div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400">
                                    No hay registros financieros recientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
