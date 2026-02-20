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
        totalPlayHours: number;
        maintenanceThreshold: number;
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
    const isCleaning = optimisticStatus === 'CLEANING';
    const isMaintenance = optimisticStatus === 'MAINTENANCE';

    // Health calculation: 100% is brand new cloth, 0% is past threshold
    const health = Math.max(0, Math.min(100, (1 - (table.totalPlayHours / (table.maintenanceThreshold || 100))) * 100));
    const healthColor = health > 50 ? '#22c55e' : health > 20 ? '#facc15' : '#ef4444';

    const handleToggle = () => {
        if (isMaintenance) {
            alert("Esta mesa se encuentra en MANTENIMIENTO.");
            return;
        }

        if (isOccupied) {
            // Already occupied? Open POS Panel instead of stopping
            if (onSelect) {
                onSelect();
            }
            return;
        }

        // Determine next status based on current
        let nextStatus = 'OCCUPIED';
        if (isCleaning) {
            nextStatus = 'AVAILABLE';
        }

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

    const getBorderColor = () => {
        if (isMaintenance) return '#94a3b8'; // Slate/Gray 400
        if (isOccupied) return '#ef4444'; // Red
        if (isCleaning) return '#facc15'; // Yellow/Amarillo
        return '#22c55e'; // Green
    };

    const getStatusLabel = () => {
        if (isMaintenance) return 'Mantenimiento';
        if (isOccupied) return 'Ocupada';
        if (isCleaning) return 'Limpieza';
        return 'Libre';
    };

    const getBadgeColor = () => {
        if (isMaintenance) return '#64748b'; // Slate 500
        if (isOccupied) return '#ef4444';
        if (isCleaning) return '#facc15';
        return primaryColor;
    };

    return (
        <div
            onClick={handleToggle}
            className={`cursor-pointer relative aspect-square flex flex-col items-center justify-center rounded-2xl shadow-sm border transition-all hover:shadow-md hover:scale-105 active:scale-95 ${isPending ? 'opacity-70' : ''}`}
            style={{
                backgroundColor: 'white',
                borderColor: getBorderColor(),
                borderWidth: '2px'
            }}
        >
            {/* Vanguard Health Bar */}
            <div className="absolute top-3 left-3 right-3 flex flex-col gap-1">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Salud Paño</span>
                    <span className="text-[10px] font-bold" style={{ color: healthColor }}>{Math.round(health)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                    <div
                        className="h-full transition-all duration-1000 ease-out"
                        style={{
                            width: `${health}%`,
                            backgroundColor: healthColor,
                            boxShadow: `0 0 8px ${healthColor}44`
                        }}
                    />
                </div>
            </div>

            <span className={`text-4xl font-black transition-colors ${isMaintenance ? 'text-gray-400' : 'text-gray-800'}`}>
                {table.number}
            </span>
            <div
                className={`mt-2 px-3 py-1 text-xs font-bold rounded-full text-white uppercase tracking-wider transition-colors duration-300`}
                style={{ backgroundColor: getBadgeColor() }}
            >
                {getStatusLabel()}
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
