'use client';

import { useState, useTransition } from 'react';
import { deleteTenant } from '@/app/actions/admin-actions';

interface DeleteTenantButtonProps {
    tenantId: string;
    tenantName: string;
}

/**
 * Botón de eliminación de Tenant con confirmación modal.
 * Solo visible para SUPER_ADMIN.
 */
export default function DeleteTenantButton({ tenantId, tenantName }: DeleteTenantButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function handleDelete() {
        const confirmed = window.confirm(
            `⚠️ ¿Estás seguro que quieres eliminar "${tenantName}"?\n\nEsta acción es IRREVERSIBLE y eliminará todos los datos asociados: mesas, usuarios, socios, historial de sesiones, etc.`
        );
        if (!confirmed) return;

        setError(null);
        startTransition(async () => {
            try {
                await deleteTenant(tenantId);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al eliminar');
            }
        });
    }

    return (
        <span className="inline-flex items-center gap-2">
            <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                title={`Eliminar ${tenantName}`}
            >
                {isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}
        </span>
    );
}
