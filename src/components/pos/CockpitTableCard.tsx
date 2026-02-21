'use client';

interface CockpitTableCardProps {
    table: any;
    onSelect: () => void;
}

export default function CockpitTableCard({ table, onSelect }: CockpitTableCardProps) {
    const isAvailable = table.status === 'AVAILABLE';

    // Status color mapping for the glowing left border
    const statusColor = {
        'AVAILABLE': 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]',
        'OCCUPIED': 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        'MAINTENANCE': 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]',
        'reserved': 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    }[table.status] || 'border-gray-500';

    return (
        <div
            onClick={onSelect}
            className={`
                relative bg-[#0b1121] rounded-2xl p-5 cursor-pointer 
                border border-[#1e293b] border-l-4 ${statusColor}
                hover:bg-[#111827] transition-all duration-300 group
            `}
        >
            {/* Top row: Name & Type */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                        Billar {table.number}
                    </h3>
                    <span className="text-gray-500 text-sm">🖥️</span>
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                    Carambola
                </span>
            </div>

            {/* Badge Status */}
            <div className="mb-6">
                <span className={`
                    text-xs px-3 py-1 rounded-full border bg-transparent font-medium
                    ${isAvailable ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}
                `}>
                    {isAvailable ? 'Disponible' : 'Ocupada'}
                </span>
            </div>

            {/* Pricing Info */}
            <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Cliente:</span>
                    <span className="text-gray-300 font-medium">$6.600</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Socio:</span>
                    <span className="text-[#22c55e] font-bold">$5.700</span>
                </div>
            </div>

            {/* Bottom Glow Text */}
            <div className="text-center pt-2">
                <p className={`
                    text-sm font-medium tracking-wide
                    ${isAvailable ? 'text-[#22c55e] animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'text-red-500'}
                `}>
                    {isAvailable ? 'Lista para usar' : 'En uso'}
                </p>
            </div>
        </div>
    );
}
