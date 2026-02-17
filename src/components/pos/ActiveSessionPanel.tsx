'use client';

import { useState, useEffect } from 'react';
import ProductSelector from './ProductSelector';
import { addProductToTable } from '@/app/actions/pos-actions';
import { toggleTableStatus } from '@/app/actions/table-actions';
// We need a way to fetch session details (items). 
// For now, we might need a server action to get `currentSession`.
// Let's assume we pass a `fetchSession` prop or use a server action directly if we can.
import { getTableSession } from '@/app/actions/pos-actions'; // We need to create this!

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
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t">
                <button
                    onClick={handleStopSession}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow transition-colors"
                >
                    Cerrar Mesa
                </button>
            </div>
        </div>
    );
}
