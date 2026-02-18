'use client';

import { useState } from 'react';
import { updateLeadStatus } from '@/app/actions/lead-actions';

type LeadStatus = 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'CONVERTED' | 'ARCHIVED';

interface Lead {
    id: string;
    name: string;
    email: string;
    country: string;
    phone: string | null;
    message: string | null;
    detectedCurrency: string | null;
    status: LeadStatus;
    createdAt: Date;
    updatedAt: Date;
}

interface LeadsClientProps {
    leads: Lead[];
}

export default function LeadsClient({ leads: initialLeads }: LeadsClientProps) {
    const [leads, setLeads] = useState(initialLeads);
    const [filterCountry, setFilterCountry] = useState('');
    const [filterStatus, setFilterStatus] = useState<LeadStatus | ''>('');
    const [filterCurrency, setFilterCurrency] = useState('');

    // Obtener países únicos
    const countries = Array.from(new Set(leads.map(l => l.country))).sort();
    const currencies = Array.from(new Set(leads.map(l => l.detectedCurrency).filter(Boolean))).sort();

    // Filtrado
    const filteredLeads = leads.filter(lead => {
        if (filterCountry && lead.country !== filterCountry) return false;
        if (filterStatus && lead.status !== filterStatus) return false;
        if (filterCurrency && lead.detectedCurrency !== filterCurrency) return false;
        return true;
    });

    // Estadísticas
    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'NEW').length,
        contacted: leads.filter(l => l.status === 'CONTACTED').length,
        demoScheduled: leads.filter(l => l.status === 'DEMO_SCHEDULED').length,
        converted: leads.filter(l => l.status === 'CONVERTED').length,
        archived: leads.filter(l => l.status === 'ARCHIVED').length
    };

    async function handleStatusChange(leadId: string, newStatus: string) {
        const result = await updateLeadStatus(leadId, newStatus);

        if (result.success) {
            // Actualizar lead local
            setLeads(prevLeads =>
                prevLeads.map(lead =>
                    lead.id === leadId ? { ...lead, status: newStatus as LeadStatus } : lead
                )
            );
        } else {
            alert(`Error: ${result.error}`);
        }
    }

    function getStatusColor(status: LeadStatus): string {
        switch (status) {
            case 'NEW': return '#3498db';
            case 'CONTACTED': return '#f39c12';
            case 'DEMO_SCHEDULED': return '#9b59b6';
            case 'CONVERTED': return '#27ae60';
            case 'ARCHIVED': return '#95a5a6';
            default: return '#333';
        }
    }

    function getStatusLabel(status: LeadStatus): string {
        const labels = {
            NEW: 'Nuevo',
            CONTACTED: 'Contactado',
            DEMO_SCHEDULED: 'Demo Agendada',
            CONVERTED: 'Convertido',
            ARCHIVED: 'Archivado'
        };
        return labels[status];
    }

    return (
        <div className="leads-client">
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Leads</h3>
                    <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-card stat-new">
                    <h3>Nuevos</h3>
                    <div className="stat-value">{stats.new}</div>
                </div>
                <div className="stat-card stat-contacted">
                    <h3>Contactados</h3>
                    <div className="stat-value">{stats.contacted}</div>
                </div>
                <div className="stat-card stat-converted">
                    <h3>Convertidos</h3>
                    <div className="stat-value">{stats.converted}</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="filters">
                <div className="filter-group">
                    <label htmlFor="filter-country">País</label>
                    <select
                        id="filter-country"
                        value={filterCountry}
                        onChange={(e) => setFilterCountry(e.target.value)}
                    >
                        <option value="">Todos</option>
                        {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-status">Estado</label>
                    <select
                        id="filter-status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as LeadStatus | '')}
                    >
                        <option value="">Todos</option>
                        <option value="NEW">Nuevo</option>
                        <option value="CONTACTED">Contactado</option>
                        <option value="DEMO_SCHEDULED">Demo Agendada</option>
                        <option value="CONVERTED">Convertido</option>
                        <option value="ARCHIVED">Archivado</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-currency">Moneda</label>
                    <select
                        id="filter-currency"
                        value={filterCurrency}
                        onChange={(e) => setFilterCurrency(e.target.value)}
                    >
                        <option value="">Todas</option>
                        {currencies.map(currency => (
                            <option key={currency} value={currency!}>{currency}</option>
                        ))}
                    </select>
                </div>

                <button
                    className="btn-clear-filters"
                    onClick={() => {
                        setFilterCountry('');
                        setFilterStatus('');
                        setFilterCurrency('');
                    }}
                >
                    Limpiar Filtros
                </button>
            </div>

            {/* Tabla de Leads */}
            <div className="leads-table-container">
                {filteredLeads.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay leads que coincidan con los filtros</p>
                    </div>
                ) : (
                    <table className="leads-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>País</th>
                                <th>Moneda</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => (
                                <tr key={lead.id}>
                                    <td>{new Date(lead.createdAt).toLocaleDateString('es-CL')}</td>
                                    <td className="td-name">{lead.name}</td>
                                    <td className="td-email">{lead.email}</td>
                                    <td>{lead.country}</td>
                                    <td>
                                        <span className="currency-badge">{lead.detectedCurrency || 'N/A'}</span>
                                    </td>
                                    <td>{lead.phone || '-'}</td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(lead.status) }}
                                        >
                                            {getStatusLabel(lead.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            className="status-selector"
                                            value={lead.status}
                                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                        >
                                            <option value="NEW">Nuevo</option>
                                            <option value="CONTACTED">Contactado</option>
                                            <option value="DEMO_SCHEDULED">Demo Agendada</option>
                                            <option value="CONVERTED">Convertido</option>
                                            <option value="ARCHIVED">Archivado</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style jsx>{`
                .leads-client {
                    background: white;
                    border-radius: 8px;
                    padding: 2rem;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 1.5rem;
                    border-radius: 8px;
                    color: white;
                    text-align: center;
                }

                .stat-card h3 {
                    margin: 0 0 0.5rem 0;
                    font-size: 0.95rem;
                    opacity: 0.9;
                    font-weight: 600;
                }

                .stat-value {
                    font-size: 2.5rem;
                    font-weight: 800;
                }

                .stat-new {
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                }

                .stat-contacted {
                    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
                }

                .stat-converted {
                    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
                }

                /* Filtros */
                .filters {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    align-items: flex-end;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .filter-group label {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #333;
                }

                .filter-group select {
                    padding: 0.5rem 1rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 1rem;
                    min-width: 150px;
                }

                .btn-clear-filters {
                    padding: 0.5rem 1.5rem;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s;
                }

                .btn-clear-filters:hover {
                    background: #c0392b;
                }

                /* Tabla */
                .leads-table-container {
                    overflow-x: auto;
                }

                .leads-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .leads-table thead {
                    background: #f8f9fa;
                }

                .leads-table th {
                    padding: 1rem;
                    text-align: left;
                    font-weight: 700;
                    color: #1a4d2e;
                    border-bottom: 2px solid #e0e0e0;
                }

                .leads-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #f0f0f0;
                }

                .td-name {
                    font-weight: 600;
                    color: #333;
                }

                .td-email {
                    color: #666;
                    font-family: monospace;
                    font-size: 0.9rem;
                }

                .currency-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: #f0f0f0;
                    border-radius: 4px;
                    font-weight: 600;
                    color: #333;
                    font-size: 0.85rem;
                }

                .status-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    color: white;
                    font-weight: 600;
                    font-size: 0.85rem;
                }

                .status-selector {
                    padding: 0.4rem 0.75rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    cursor: pointer;
                }

                .empty-state {
                    padding: 3rem;
                    text-align: center;
                    color: #999;
                }

                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .filters {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-group select {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
