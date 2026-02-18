'use client';

import { useState } from 'react';

export type LockerStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

interface Locker {
    id: string;
    number: number;
    status: LockerStatus;
    occupiedBy?: {
        memberId: string;
        memberName: string;
        rentedUntil: Date;
    };
}

interface LockerManagementProps {
    lockers: Locker[];
    onAssignLocker?: (lockerId: string, memberId: string) => Promise<void>;
    onReleaseLocker?: (lockerId: string) => Promise<void>;
}

/**
 * 🏛️ Locker Management - Heritage Elite Style
 * For CLUB_SOCIOS model only
 */
export default function LockerManagement({
    lockers,
    onAssignLocker,
    onReleaseLocker
}: LockerManagementProps) {
    const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleLockerClick = (locker: Locker) => {
        setSelectedLocker(locker);
    };

    const handleAssign = async () => {
        if (!selectedLocker || !onAssignLocker) return;

        const memberId = prompt('Ingrese ID del socio:');
        if (!memberId) return;

        setIsProcessing(true);
        try {
            await onAssignLocker(selectedLocker.id, memberId);
            setSelectedLocker(null);
        } catch (error) {
            alert('Error al asignar casillero');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRelease = async () => {
        if (!selectedLocker || !onReleaseLocker) return;

        if (!confirm('¿Liberar este casillero?')) return;

        setIsProcessing(true);
        try {
            await onReleaseLocker(selectedLocker.id);
            setSelectedLocker(null);
        } catch (error) {
            alert('Error al liberar casillero');
        } finally {
            setIsProcessing(false);
        }
    };

    const stats = {
        available: lockers.filter(l => l.status === 'AVAILABLE').length,
        occupied: lockers.filter(l => l.status === 'OCCUPIED').length,
        reserved: lockers.filter(l => l.status === 'RESERVED').length
    };

    return (
        <div className="locker-management heritage-elite">
            <div className="management-header">
                <h2>Mapa de Casilleros</h2>
                <div className="stats">
                    <div className="stat available">
                        <span className="count">{stats.available}</span>
                        <span className="label">Disponibles</span>
                    </div>
                    <div className="stat occupied">
                        <span className="count">{stats.occupied}</span>
                        <span className="label">Ocupados</span>
                    </div>
                    <div className="stat reserved">
                        <span className="count">{stats.reserved}</span>
                        <span className="label">Reservados</span>
                    </div>
                </div>
            </div>

            <div className="locker-grid">
                {lockers.map(locker => (
                    <div
                        key={locker.id}
                        className={`locker locker-${locker.status.toLowerCase()} ${selectedLocker?.id === locker.id ? 'selected' : ''
                            }`}
                        onClick={() => handleLockerClick(locker)}
                    >
                        <span className="number">{locker.number}</span>
                        {locker.status === 'OCCUPIED' && (
                            <span className="icon">🔒</span>
                        )}
                        {locker.status === 'RESERVED' && (
                            <span className="icon">📅</span>
                        )}
                    </div>
                ))}
            </div>

            {selectedLocker && (
                <div className="locker-details">
                    <h3>Casillero #{selectedLocker.number}</h3>

                    {selectedLocker.status === 'OCCUPIED' && selectedLocker.occupiedBy ? (
                        <>
                            <div className="detail-row">
                                <span className="label">Arrendado por:</span>
                                <span className="value">{selectedLocker.occupiedBy.memberName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Vigencia hasta:</span>
                                <span className="value">
                                    {new Date(selectedLocker.occupiedBy.rentedUntil).toLocaleDateString('es-CL')}
                                </span>
                            </div>
                            <button
                                onClick={handleRelease}
                                disabled={isProcessing}
                                className="btn-release"
                            >
                                {isProcessing ? 'Procesando...' : '🔓 Liberar Casillero'}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="status-message">
                                Este casillero está {selectedLocker.status === 'RESERVED' ? 'reservado' : 'disponible'}
                            </p>
                            <button
                                onClick={handleAssign}
                                disabled={isProcessing}
                                className="btn-assign"
                            >
                                {isProcessing ? 'Procesando...' : '🔑 Asignar a Socio'}
                            </button>
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
                .locker-management.heritage-elite {
                    background: linear-gradient(145deg, 
                        var(--color-primary), 
                        rgba(212, 175, 55, 0.05)
                    );
                    border: 2px solid rgba(212, 175, 55, 0.3);
                    border-radius: var(--border-radius);
                    padding: 24px;
                    color: var(--color-text-primary);
                }
                
                .management-header {
                    margin-bottom: 24px;
                }
                
                .management-header h2 {
                    margin: 0 0 16px 0;
                    font-family: var(--font-heading);
                    font-size: 24px;
                    font-weight: var(--font-heading-weight);
                    color: var(--color-secondary);
                }
                
                .stats {
                    display: flex;
                    gap: 16px;
                }
                
                .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px 20px;
                    border-radius: 8px;
                    background: rgba(212, 175, 55, 0.1);
                }
                
                .stat .count {
                    font-size: 24px;
                    font-weight: 700;
                    font-family: var(--font-heading);
                }
                
                .stat .label {
                    font-size: 12px;
                    color: var(--color-text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .stat.available .count { color: #4ade80; }
                .stat.occupied .count { color: var(--color-secondary); }
                .stat.reserved .count { color: #fbbf24; }
                
                .locker-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                    gap: 12px;
                    margin-bottom: 24px;
                }
                
                .locker {
                    aspect-ratio: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                
                .locker:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
                }
                
                .locker.selected {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
                }
                
                .locker-available {
                    border-color: #4ade80;
                    background: rgba(74, 222, 128, 0.1);
                }
                
                .locker-occupied {
                    border-color: var(--color-secondary);
                    background: rgba(212, 175, 55, 0.15);
                }
                
                .locker-reserved {
                    border-color: #fbbf24;
                    background: rgba(251, 191, 36, 0.1);
                }
                
                .locker .number {
                    font-size: 20px;
                    font-weight: 700;
                    font-family: var(--font-heading);
                }
                
                .locker .icon {
                    font-size: 16px;
                    margin-top: 4px;
                }
                
                .locker-details {
                    padding: 20px;
                    background: rgba(212, 175, 55, 0.05);
                    border-left: 4px solid var(--color-secondary);
                    border-radius: 8px;
                }
                
                .locker-details h3 {
                    margin: 0 0 16px 0;
                    font-family: var(--font-heading);
                    font-size: 18px;
                    color: var(--color-secondary);
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(212, 175, 55, 0.1);
                }
                
                .detail-row .label {
                    color: var(--color-text-secondary);
                    font-size: 14px;
                }
                
                .detail-row .value {
                    color: var(--color-text-primary);
                    font-weight: 600;
                }
                
                .status-message {
                    color: var(--color-text-secondary);
                    margin: 12px 0;
                }
                
                button {
                    width: 100%;
                    padding: 12px 24px;
                    margin-top: 16px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .btn-assign {
                    background: var(--color-secondary);
                    color: var(--color-primary);
                }
                
                .btn-assign:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
                }
                
                .btn-release {
                    background: rgba(239, 68, 68, 0.9);
                    color: white;
                }
                
                .btn-release:hover:not(:disabled) {
                    background: rgba(239, 68, 68, 1);
                }
            `}</style>
        </div>
    );
}
