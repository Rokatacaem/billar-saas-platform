'use client';

import { useOptimistic, useTransition } from "react";
import TableTimer from "./TableTimer";
import { toggleTableStatus } from "@/app/actions/table-actions";

interface TableCardProps {
    table: {
        id: string;
        number: number;
        status: string;
        lastSessionStart: Date | null;
    };
    primaryColor: string;
    onSelect?: () => void;
}

export default function TableCard({ table, primaryColor, onSelect }: TableCardProps) {
    const [isPending, startTransition] = useTransition();
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(
        table.status,
        (state, newStatus: string) => newStatus
    );

    const isOccupied = optimisticStatus === 'OCCUPIED';

    const handleToggle = () => {
        if (isOccupied) {
            // Already occupied? Open POS Panel instead of stopping
            if (onSelect) {
                onSelect();
            }
            return;
        }

        // Only toggle if AVAILABLE (to start session)
        const nextStatus = 'OCCUPIED';

        startTransition(async () => {
            setOptimisticStatus(nextStatus);
            try {
                await toggleTableStatus(table.id, optimisticStatus);
            } catch (error) {
                console.error("Failed to update table status:", error);
                alert("Error al actualizar la mesa. Asegúrate de haber iniciado sesión.");
                // Rollback
                startTransition(() => {
                    setOptimisticStatus(table.status);
                });
            }
        });
    };

    return (
        <div
            onClick={handleToggle}
            className={`cursor-pointer relative aspect-square flex flex-col items-center justify-center rounded-2xl shadow-sm border transition-all hover:shadow-md hover:scale-105 active:scale-95 ${isPending ? 'opacity-70' : ''}`}
            style={{
                backgroundColor: 'white',
                borderColor: isOccupied ? '#ef4444' : '#22c55e',
                borderWidth: '2px'
            }}
        >
            <span className="text-3xl font-bold text-gray-800">#{table.number}</span>
            <div
                className={`mt-2 px-3 py-1 text-xs font-bold rounded-full text-white uppercase tracking-wider transition-colors duration-300`}
                style={{ backgroundColor: isOccupied ? '#ef4444' : primaryColor }}
            >
                {isOccupied ? 'Ocupada' : 'Libre'}
            </div>

            {isOccupied && table.lastSessionStart && (
                <TableTimer startTime={table.lastSessionStart} primaryColor={primaryColor} />
            )}

            {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-2xl">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
