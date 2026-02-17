'use client';

import { useState } from 'react';
import { createServiceRequest } from '@/app/actions/qr-actions';
import { getReceiptData, confirmPayment as confirmPaymentAction } from '@/app/actions/payment-actions';

interface QrClientProps {
    tenant: any;
    table: any;
}

export default function QrClient({ tenant, table }: QrClientProps) {
    const [requestStatus, setRequestStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [lastRequestType, setLastRequestType] = useState<string | null>(null);

    const handleRequest = async (type: 'CALL' | 'ORDER') => {
        setRequestStatus('LOADING');
        try {
            const res = await createServiceRequest(tenant.id, table.id, type);
            if (res.success) {
                setRequestStatus('SUCCESS');
                setLastRequestType(type === 'CALL' ? 'Mozo solicitado' : 'Carta solicitada');
            } else {
                setRequestStatus('ERROR');
            }
        } catch (error) {
            console.error(error);
            setRequestStatus('ERROR');
        }
    };

    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    // Effect to load receipt data if pending payment
    // We would need currentSessionId from table prop, but table prop might be stale or simple.
    // Ideally we fetch recent session or use table.currentSessionId if available.
    // Let's assume table prop includes currentSessionId if status is PAYMENT_PENDING.

    const handlePayNow = async () => {
        if (!table.currentSessionId) return;
        setPaymentProcessing(true);
        try {
            const data = await getReceiptData(table.currentSessionId);
            setReceiptData(data);
        } catch (e) {
            console.error(e);
            alert("Error cargando cuenta");
            setPaymentProcessing(false);
        }
    };

    const confirmPayment = async (method: string) => {
        setPaymentProcessing(true);
        try {
            await confirmPaymentAction(table.currentSessionId, tenant.id, method);
            alert("¡Pago Exitoso!");
            // Generate PDF
            generatePDF(receiptData);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Error procesando pago");
        } finally {
            setPaymentProcessing(false);
        }
    };

    const generatePDF = (data: any) => {
        import('jspdf').then(jsPDF => {
            import('jspdf-autotable').then(() => {
                const doc = new jsPDF.default();

                // Header
                doc.setFontSize(18);
                doc.text(data.tenantName, 14, 22);
                doc.setFontSize(11);
                doc.text(`Mesa: ${data.tableNumber}`, 14, 30);
                doc.text(`Fecha: ${new Date(data.date).toLocaleString()}`, 14, 36);

                // Items Table
                const tableBody = data.items.map((item: any) => [
                    item.description,
                    item.quantity.toString(),
                    `$${item.total.toFixed(0)}`
                ]);

                // Add Time Charge
                tableBody.push(['Tiempo de Juego', `${data.durationMinutes} min`, `$${data.timeCharge.toFixed(0)}`]);

                if (data.discount > 0) {
                    tableBody.push(['Descuento Socio', '', `-$${data.discount.toFixed(0)}`]);
                }

                // @ts-ignore
                doc.autoTable({
                    head: [['Descripción', 'Cant', 'Total']],
                    body: tableBody,
                    startY: 45,
                    theme: 'grid',
                    foot: [['', 'Total', `$${data.total.toFixed(0)}`]]
                });

                doc.save(`recibo_${data.tableNumber}_${Date.now()}.pdf`);
            });
        });
    };

    if (table.status === 'PAYMENT_PENDING' || receiptData) {
        if (receiptData && !paymentProcessing) {
            // Payment Confirmation Screen
            return (
                <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-indigo-100 p-6 animate-in slide-in-from-bottom-5">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Resumen de Cuenta</h2>
                    <div className="space-y-2 mb-6 text-sm text-gray-600">
                        {receiptData.items.map((i: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                                <span>{i.quantity}x {i.description}</span>
                                <span>${i.total}</span>
                            </div>
                        ))}
                        <div className="flex justify-between font-semibold text-indigo-900 pt-2 border-t">
                            <span>Total a Pagar</span>
                            <span className="text-xl">${receiptData.total}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => confirmPayment('CARD')}
                            className="bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
                        >
                            💳 Tarjeta
                        </button>
                        <button
                            onClick={() => confirmPayment('CASH')}
                            className="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
                        >
                            💵 Efectivo
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="w-full max-w-sm bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center animate-in zoom-in">
                <div className="text-5xl mb-4">💳</div>
                <h2 className="text-xl font-bold text-indigo-900 mb-2">Mesa Cerrada</h2>
                <p className="text-indigo-700 mb-6">Tu cuenta está lista para pagar.</p>
                <button
                    onClick={handlePayNow}
                    disabled={paymentProcessing}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
                >
                    {paymentProcessing ? 'Cargando...' : 'Ver Cuenta y Pagar'}
                </button>
            </div>
        );
    }

    if (requestStatus === 'SUCCESS') {
        return (
            <div className="w-full max-w-sm bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-in zoom-in">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-green-900 mb-2">¡Solicitud Enviada!</h2>
                <p className="text-green-700 mb-6">{lastRequestType}. En breve te atenderemos.</p>
                <button
                    onClick={() => setRequestStatus('IDLE')}
                    className="w-full py-3 bg-white border border-green-200 text-green-700 font-bold rounded-lg hover:bg-green-100 transition"
                >
                    Hacer otra solicitud
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm flex flex-col gap-4">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Estado de la Mesa</p>
                <div className={`text-xl font-bold ${table.status === 'OCCUPIED' ? 'text-red-600' : 'text-green-600'}`}>
                    {table.status === 'OCCUPIED' ? '🔴 Ocupada' : table.status === 'PAYMENT_PENDING' ? '💳 Pago Pendiente' : '🟢 Disponible'}
                </div>
            </div>

            {/* Actions */}
            <button
                onClick={() => handleRequest('CALL')}
                disabled={requestStatus === 'LOADING' || table.status === 'AVAILABLE'}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center gap-3 text-lg font-bold transition-transform active:scale-95 disabled:opacity-70 disabled:bg-gray-400"
            >
                <span className="text-2xl">🔔</span>
                Llamar al Mozo
            </button>

            <button
                onClick={() => handleRequest('ORDER')}
                disabled={requestStatus === 'LOADING' || table.status === 'AVAILABLE'}
                className="w-full py-6 bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 rounded-xl shadow-sm flex items-center justify-center gap-3 text-lg font-bold transition-transform active:scale-95 disabled:opacity-70 disabled:border-gray-400 disabled:text-gray-500"
            >
                <span className="text-2xl">🍽️</span>
                Pedir la Carta
            </button>

            {requestStatus === 'ERROR' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center text-sm">
                    Ocurrió un error. Por favor intenta nuevamente.
                </div>
            )}
        </div>
    );
}
