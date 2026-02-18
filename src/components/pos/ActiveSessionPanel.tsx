'use client';

import { useState, useEffect } from 'react';
import ProductSelector from './ProductSelector';
import { addProductToTable } from '@/app/actions/pos-actions';
import { toggleTableStatus } from '@/app/actions/table-actions';
import { logSplitTransactionAction } from '@/app/actions/audit-actions';
import SplitBillModal, { SplitPart } from '@/components/comercial/SplitBillModal';
import { validateSplitConsistency } from '@/lib/sentinel/split-validator';

interface ActiveSessionPanelProps {
    table: any; // Type handling to be improved
    products: any[];
    onClose: () => void;
    tenantBaseRate: number;
}

// ... (imports remain)
import { getMembers } from '@/app/actions/member-actions';

export default function ActiveSessionPanel({ table, products, onClose, tenantBaseRate }: ActiveSessionPanelProps) {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'BILL'>('PRODUCTS');
    const [sessionItems, setSessionItems] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [elapsedMinutes, setElapsedMinutes] = useState(0);

    // Member State
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Split Bill State
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitReceipts, setSplitReceipts] = useState<SplitPart[]>([]);
    const [notification, setNotification] = useState<{ message: string, type: string } | null>(null);


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
        const confirmMsg = selectedMember
            ? `¿Cerrar mesa para ${selectedMember.name}? Descuento: ${selectedMember.discount}%`
            : "¿Cerrar mesa y finalizar cuenta?";

        if (confirm(confirmMsg)) {
            await toggleTableStatus(table.id, 'OCCUPIED', selectedMember?.id);
            onClose();
        }
    };

    const productTotal = sessionItems.reduce((acc, item) => acc + item.totalPrice, 0);

    // Calculate Totals with Discount
    let timeTotal = elapsedMinutes * tenantBaseRate;
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
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl p-6 flex flex-col z-50 animate-in slide-in-from-right">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Mesa #{table.number}</h2>
                    <span className="text-sm text-green-600 font-medium">En curso ({elapsedMinutes} min)</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {notification && (
                <div className={`mb-4 p-3 rounded-md text-sm ${notification.type === 'error' ? 'bg-red-50 text-red-700' :
                    notification.type === 'success' ? 'bg-green-50 text-green-700' :
                        'bg-blue-50 text-blue-700'
                    }`}>
                    {notification.message}
                    <button onClick={() => setNotification(null)} className="ml-2 float-right font-bold">×</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('PRODUCTS')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'PRODUCTS' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Productos
                </button>
                <button
                    onClick={() => setActiveTab('BILL')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'BILL' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Cuenta (${grandTotal.toFixed(2)})
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'PRODUCTS' ? (
                    <ProductSelector products={products} onAddProduct={handleAddProduct} isAdding={isAdding} />
                ) : (
                    <div className="space-y-4 overflow-y-auto h-full pr-2">
                        {/* Member Selector */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">Asociar Socio (Descuento)</h3>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o RUT..."
                                className="w-full text-sm border-gray-300 rounded-md p-2 mb-2"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <ul className="max-h-32 overflow-y-auto bg-white border rounded-md shadow-sm">
                                    {filteredMembers.map(m => (
                                        <li
                                            key={m.id}
                                            onClick={() => { setSelectedMember(m); setSearchTerm(""); }}
                                            className="p-2 text-sm hover:bg-gray-50 cursor-pointer flex justify-between"
                                        >
                                            <span>{m.name}</span>
                                            <span className="text-green-600 font-bold">{m.discount}% OFF</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {selectedMember && (
                                <div className="mt-2 flex justify-between items-center bg-white p-2 rounded border border-green-200">
                                    <span className="text-sm font-medium text-green-800">👤 {selectedMember.name}</span>
                                    <button onClick={() => setSelectedMember(null)} className="text-xs text-red-500 hover:underline">Quitar</button>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Tiempo</h3>
                            <div className="flex justify-between text-sm">
                                <span>{elapsedMinutes} min x ${tenantBaseRate}</span>
                                <span className="font-mono">${(elapsedMinutes * tenantBaseRate).toFixed(2)}</span>
                            </div>
                            {selectedMember && selectedMember.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600 mt-1">
                                    <span>Descuento Socio ({selectedMember.discount}%)</span>
                                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t">
                                <span>Subtotal Tiempo</span>
                                <span className="font-mono text-gray-900">${timeTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Consumo</h3>
                            {sessionItems.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No hay productos cargados.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {sessionItems.map((item, idx) => (
                                        <li key={idx} className="flex justify-between text-sm">
                                            <span>{item.quantity}x {item.product.name}</span>
                                            <span className="font-mono">${item.totalPrice.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-semibold text-sm">
                                <span>Subtotal Bar</span>
                                <span>${productTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <div className="flex justify-between text-lg font-bold text-indigo-900">
                                <span>Total a Pagar</span>
                                <span>${grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Split Bill - COMERCIAL Feature */}
                        {splitReceipts.length > 0 && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-xs font-semibold text-green-800 mb-2">✅ Cuenta dividida en {splitReceipts.length} partes:</p>
                                {splitReceipts.map((s) => (
                                    <div key={s.partNumber} className="flex justify-between text-sm text-green-700">
                                        <span>Persona #{s.partNumber}</span>
                                        <span className="font-mono font-bold">${s.amount.toFixed(2)}</span>
                                    </div>
                                ))}
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
                <button
                    onClick={handleStopSession}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow transition-colors"
                >
                    Cerrar Mesa
                </button>
            </div>

            {/* Split Bill Modal */}
            {showSplitModal && (
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
            )}
        </div>
    );
}
