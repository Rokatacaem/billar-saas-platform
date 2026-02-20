'use client';

import { useState, useEffect } from 'react';
import ProductSelector from './ProductSelector';
import { addProductToTable } from '@/app/actions/pos-actions';
import { toggleTableStatus } from '@/app/actions/table-actions';
import { logSplitTransactionAction } from '@/app/actions/audit-actions';
import SplitBillModal, { SplitPart } from '@/components/comercial/SplitBillModal';
import { validateSplitConsistency } from '@/lib/sentinel/split-validator';
import { formatRut, validateRut } from '@/lib/chile/rut-validator';
import { createTableCheckoutSession } from '@/app/actions/payment-actions';
import { getMembers } from '@/app/actions/member-actions';

interface ActiveSessionPanelProps {
    table: any; // Type handling to be improved
    products: any[];
    onClose: () => void;
    tenantBaseRate: number;
}

export default function ActiveSessionPanel({ table, products, onClose, tenantBaseRate }: ActiveSessionPanelProps) {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'BILL'>('PRODUCTS');
    const [sessionItems, setSessionItems] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [elapsedMinutes, setElapsedMinutes] = useState(0);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [isGeneratingQr, setIsGeneratingQr] = useState(false);

    // Member State
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Split Bill State
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitReceipts, setSplitReceipts] = useState<SplitPart[]>([]);
    const [notification, setNotification] = useState<{ message: string, type: string } | null>(null);

    // 🧾 DTE Checkout State (SII Connect)
    const [tipoDTE, setTipoDTE] = useState<number>(39); // 39 Boleta, 33 Factura
    const [dteRut, setDteRut] = useState('');
    const [dteRazon, setDteRazon] = useState('');
    const [dteGiro, setDteGiro] = useState('');
    const [dteError, setDteError] = useState('');


    // Initial Load
    useEffect(() => {
        // Fetch Members for selector
        getMembers().then(setMembers);
    }, []);

    // Timer Logic
    useEffect(() => {
        if (!table.lastSessionStart) return;
        const start = new Date(table.lastSessionStart).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            setElapsedMinutes(Math.max(0, Math.floor((now - start) / 60000)));
        };

        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [table.lastSessionStart]);


    const handleAddProduct = async (product: any) => {
        setIsAdding(true);
        try {
            await addProductToTable(table.id, product.id, 1);
            setSessionItems(prev => [...prev, { product, quantity: 1, unitPrice: product.price, totalPrice: product.price }]);
            alert("Producto agregado!");
        } catch (error) {
            console.error(error);
            alert("Error al agregar producto");
        } finally {
            setIsAdding(false);
        }
    };

    const handleStopSession = async () => {
        // Validación de DTE Factura
        if (tipoDTE === 33) {
            if (!dteRut || !validateRut(dteRut)) {
                setDteError('RUT Corporativo inválido.');
                return;
            }
            if (!dteRazon.trim() || !dteGiro.trim()) {
                setDteError('Razón Social y Giro son obligatorios para Factura.');
                return;
            }
        }
        setDteError('');

        const confirmMsg = selectedMember
            ? `¿Cerrar mesa para ${selectedMember.name}? Descuento: ${selectedMember.discount}%${tipoDTE === 33 ? ' (Emitiendo Factura)' : ''}`
            : `¿Cerrar mesa y finalizar cuenta?${tipoDTE === 33 ? ' (Emitiendo Factura)' : ''}`;

        if (confirm(confirmMsg)) {
            await toggleTableStatus(table.id, 'OCCUPIED', selectedMember?.id, {
                tipoDTE,
                rutReceptor: tipoDTE === 33 ? dteRut : undefined,
                razonSocialReceptor: tipoDTE === 33 ? dteRazon.toUpperCase() : undefined,
                giroReceptor: tipoDTE === 33 ? dteGiro.toUpperCase() : undefined
            });
            onClose();
        }
    };

    const handleGenerateQr = async () => {
        setIsGeneratingQr(true);
        try {
            const res = await createTableCheckoutSession(table.id);
            if (res.success && res.paymentUrl) {
                setCheckoutUrl(res.paymentUrl);
            } else {
                setNotification({ message: `Error pasarela: ${res.error}`, type: 'error' });
            }
        } catch (e) {
            setNotification({ message: 'Error de red generando checkout', type: 'error' });
        } finally {
            setIsGeneratingQr(false);
        }
    };

    const productTotal = sessionItems.reduce((acc, item) => acc + item.totalPrice, 0);

    // Calculate Totals with Discount
    let timeTotal = (elapsedMinutes / 60) * tenantBaseRate;
    let discountAmount = 0;

    if (selectedMember && selectedMember.discount > 0) {
        discountAmount = timeTotal * (selectedMember.discount / 100);
        timeTotal -= discountAmount;
    }

    const grandTotal = productTotal + timeTotal;

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.rut && m.rut.includes(searchTerm))
    );

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl p-6 flex flex-col z-50 animate-in slide-in-from-right border-l border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Mesa #{table.number}</h2>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-semibold text-red-600">Sesión Activa</span>
                        <span className="text-xs text-gray-400 font-mono ml-1">{elapsedMinutes} min</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {notification && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${notification.type === 'error' ? 'bg-red-50 text-red-700' :
                    notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                    {notification.message}
                    <button onClick={() => setNotification(null)} className="ml-2 float-right font-bold text-lg leading-none">×</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('PRODUCTS')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'PRODUCTS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🛒 Consumo
                </button>
                <button
                    onClick={() => setActiveTab('BILL')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'BILL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🧾 Cuenta
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'PRODUCTS' ? (
                    <ProductSelector products={products} onAddProduct={handleAddProduct} isAdding={isAdding} />
                ) : (
                    <div className="space-y-4 overflow-y-auto h-full pr-2 custom-scrollbar">
                        {/* Member Selector */}
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">Socio / Beneficio</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o RUT..."
                                    className="w-full text-sm border-gray-200 rounded-lg p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-lg shadow-xl py-1">
                                        {filteredMembers.length > 0 ? filteredMembers.map(m => (
                                            <li
                                                key={m.id}
                                                onClick={() => { setSelectedMember(m); setSearchTerm(""); }}
                                                className="px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer flex justify-between items-center group transition-colors"
                                            >
                                                <span className="font-medium text-gray-700 group-hover:text-indigo-700">{m.name}</span>
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">{m.discount}% OFF</span>
                                            </li>
                                        )) : (
                                            <li className="px-4 py-3 text-sm text-gray-500 italic text-center">No se encontraron socios</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                            {selectedMember && (
                                <div className="mt-3 flex justify-between items-center bg-white p-3 rounded-lg border border-emerald-200 shadow-sm animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                                            {selectedMember.name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-bold text-emerald-900">{selectedMember.name}</span>
                                    </div>
                                    <button onClick={() => setSelectedMember(null)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors uppercase">Quitar</button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Desglose de Tiempo</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tarifa: <span className="font-bold text-gray-900">${tenantBaseRate}</span>/hr</span>
                                    <span className="text-gray-400 font-mono">({elapsedMinutes} min)</span>
                                </div>
                                <div className="flex justify-between text-lg font-mono font-bold text-gray-900 pt-1">
                                    <span className="text-sm font-sans font-medium text-gray-500">Subtotal Tiempo</span>
                                    <span>${(elapsedMinutes / 60 * tenantBaseRate).toFixed(2)}</span>
                                </div>
                                {selectedMember && selectedMember.discount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50 dashed border-2">
                                        <span className="font-medium">Dscto. Socio ({selectedMember.discount}%)</span>
                                        <span className="font-mono font-bold">-${discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Consumo de Bar</h3>
                            {sessionItems.length === 0 ? (
                                <p className="text-xs text-gray-400 italic py-2">No hay productos cargados.</p>
                            ) : (
                                <ul className="space-y-2 mb-3">
                                    {sessionItems.map((item, idx) => (
                                        <li key={idx} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{item.quantity}x {item.product.name}</span>
                                            <span className="font-mono font-semibold">${item.totalPrice.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase">Subtotal Bar</span>
                                <span className="text-sm font-bold text-gray-900 font-mono">${productTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl shadow-lg shadow-indigo-200">
                            <div className="flex justify-between items-center text-white">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Total a Pagar</span>
                                    <span className="text-xs opacity-60">Impuestos incluidos</span>
                                </div>
                                <span className="text-2xl font-black font-mono tracking-tighter">${grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* 📝 Checkout DTE Selector (SII Connect) */}
                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Comprobante de Venta</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTipoDTE(39)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${tipoDTE === 39 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                    🧾 Boleta (39)
                                </button>
                                <button
                                    onClick={() => setTipoDTE(33)}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${tipoDTE === 33 ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                    🏢 Factura (33)
                                </button>
                            </div>

                            {tipoDTE === 33 && (
                                <div className="pt-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <input
                                        type="text"
                                        placeholder="RUT Corporativo (ej. 76.123.456-K)"
                                        value={dteRut}
                                        onChange={e => setDteRut(formatRut(e.target.value))}
                                        className="w-full text-xs p-2 border border-gray-200 rounded-md focus:outline-none focus:border-emerald-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Razón Social"
                                        value={dteRazon}
                                        onChange={e => setDteRazon(e.target.value)}
                                        className="w-full text-xs p-2 border border-gray-200 rounded-md focus:outline-none focus:border-emerald-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Giro (Actividad)"
                                        value={dteGiro}
                                        onChange={e => setDteGiro(e.target.value)}
                                        className="w-full text-xs p-2 border border-gray-200 rounded-md focus:outline-none focus:border-emerald-500"
                                    />
                                    {dteError && <p className="text-[10px] text-red-500 font-bold">{dteError}</p>}
                                </div>
                            )}
                        </div>

                        {/* Split Bill - COMERCIAL Feature */}
                        {splitReceipts.length > 0 && (
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top duration-300">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1 bg-emerald-100 rounded text-emerald-700">✅</div>
                                    <h4 className="text-xs font-bold text-emerald-900 uppercase">Cuenta Dividida ({splitReceipts.length} partes)</h4>
                                </div>
                                <div className="space-y-2">
                                    {splitReceipts.map((s) => (
                                        <div key={s.partNumber} className="flex justify-between text-sm bg-white/50 px-2 py-1.5 rounded-md">
                                            <span className="text-emerald-800">Persona #{s.partNumber}</span>
                                            <span className="font-mono font-bold text-emerald-900">${s.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
                {/* Split Bill Button */}
                {activeTab === 'BILL' && (
                    <button
                        onClick={() => setShowSplitModal(true)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                    >
                        ➗ Dividir Cuenta
                    </button>
                )}

                {/* Qr Checkout Button */}
                {activeTab === 'BILL' && (
                    <button
                        onClick={handleGenerateQr}
                        disabled={isGeneratingQr || grandTotal <= 0}
                        className="w-full py-3 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white font-bold rounded-lg shadow transition-colors flex justify-center items-center gap-2"
                    >
                        {isGeneratingQr ? 'Generando...' : '📱 Generar QR (Pago Online)'}
                    </button>
                )}

                <button
                    onClick={handleStopSession}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow transition-colors"
                >
                    Cerrar Mesa (Pago Efectivo/Local)
                </button>
            </div>

            {/* Split Bill Modal */}
            {
                showSplitModal && (
                    <SplitBillModal
                        totalAmount={grandTotal}
                        currency="$"
                        onSplit={async (splits) => {
                            // Sentinel: validate consistency
                            const validation = validateSplitConsistency(grandTotal, splits);

                            if (!validation.valid) {
                                // Even if invalid (should be blocked by UI), log attempt
                                // Now using Server Action to avoid bundling issues
                                await logSplitTransactionAction(
                                    'akapoolco', // TODO: Get from context/props
                                    table.id,
                                    grandTotal,
                                    splits,
                                    validation
                                );
                                setNotification({
                                    message: `Error de consistencia: ${validation.violations.join(', ')}`,
                                    type: 'info'
                                });
                                return; // Stop processing
                            }

                            // Success path
                            setSplitReceipts(splits);
                            setShowSplitModal(false);

                            // Log success audit via Server Action
                            await logSplitTransactionAction(
                                'akapoolco', // TODO: Get from context/props 
                                table.id,
                                grandTotal,
                                splits,
                                validation
                            );

                            setNotification({
                                message: 'Cuenta dividida correctamente. Cada persona puede pagar su parte.',
                                type: 'success'
                            });
                        }}
                        onCancel={() => setShowSplitModal(false)}
                    />
                )
            }

            {/* Link de Pago / QR Modal */}
            {checkoutUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-xl p-8 w-full max-w-sm text-center shadow-2xl relative">
                        <div className="text-4xl absolute -top-5 bg-[var(--theme-primary)] rounded-full w-14 h-14 flex items-center justify-center text-white left-1/2 -translate-x-1/2 border-4 border-white">
                            📱
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mt-4 mb-2">Checkout Liquidando Mesa</h2>
                        <p className="text-gray-500 text-sm mb-6">Escanea el QR o envía este link al cliente.</p>

                        <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between border border-gray-200 mb-6">
                            <span className="text-xs text-gray-700 truncate mr-4 font-mono select-all">
                                {window.location.origin}{checkoutUrl}
                            </span>
                        </div>

                        {/* Simulación de QR Gráfico usando CSS para MVP */}
                        <div className="w-48 h-48 mx-auto bg-white border-4 border-gray-900 grid grid-cols-4 grid-rows-4 gap-1 p-2">
                            <div className="bg-gray-900 col-span-2 row-span-2 rounded" />
                            <div className="bg-[var(--theme-primary)] col-span-1 row-span-1 rounded" />
                            <div className="bg-gray-900 col-span-1 row-span-2 rounded" />
                            <div className="bg-gray-900 col-span-2 row-span-1 rounded" />
                            <div className="bg-[var(--theme-primary)] col-span-2 row-span-2 rounded" />
                            <div className="bg-gray-900 col-span-1 row-span-1 rounded" />
                        </div>

                        <div className="mt-8 space-y-2">
                            <a
                                href={checkoutUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full block text-center px-4 py-3 bg-[var(--theme-primary)] text-white rounded-lg hover:bg-[var(--theme-primary-hover)] font-bold shadow-md shadow-[var(--theme-primary-transparent)] transition-all"
                            >
                                Simular Pago
                            </a>
                            <button
                                onClick={() => { setCheckoutUrl(null); onClose(); }}
                                className="w-full py-3 text-gray-500 font-medium hover:text-gray-800 transition"
                            >
                                Cerrar Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
