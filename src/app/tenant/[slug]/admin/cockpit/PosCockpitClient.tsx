'use client';

import { useState } from 'react';
import CockpitTableCard from '@/components/pos/CockpitTableCard';
import ActiveSessionPanel from '@/components/pos/ActiveSessionPanel';

interface PosCockpitClientProps {
    tenant: any;
    tables: any[];
    products: any[];
}

export default function PosCockpitClient({ tenant, tables, products }: PosCockpitClientProps) {
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('TODAS');

    const selectedTable = tables.find(t => t.id === selectedTableId);

    const tabs = ['TODAS', 'BILLAR', 'BOLA 9', 'POOL CHILENO', 'POOL (AMERICANO)', 'SNOOKER', 'CARTAS'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Filter Tabs */}
            <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            whitespace-nowrap px-4 py-2 text-xs font-bold rounded-full transition-all border
                            ${activeTab === tab
                                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                                : 'bg-transparent text-gray-500 border-[#1e293b] hover:text-gray-300 hover:border-gray-500'}
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            {/* Grid of Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map(table => (
                    <CockpitTableCard
                        key={table.id}
                        table={table}
                        onSelect={() => setSelectedTableId(table.id)}
                    />
                ))}
            </div>

            {/* Active Session Slide-over / Modal */}
            {selectedTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    {/* Reutilizamos el ActiveSessionPanel actual, pero adaptando colores si es posible. 
                        Por ahora lo encapsulamos. */}
                    <ActiveSessionPanel
                        table={selectedTable}
                        products={products}
                        onClose={() => setSelectedTableId(null)}
                        tenantBaseRate={tenant.baseRate}
                    />
                </div>
            )}
        </div>
    );
}
