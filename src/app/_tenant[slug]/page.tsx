export default function TenantDashboard({ params }: { params: { slug: string } }) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
                <h2 className="text-2xl font-semibold">Bienvenidos al Dashboard de {params.slug}</h2>
                <p className="mt-2 text-slate-500">
                    Esta interfaz se adaptará automáticamente según el tipo de negocio.
                </p>
                <button
                    className="mt-6 rounded-lg px-6 py-2 text-white shadow-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    Acción Principal
                </button>
            </div>
        </div>
    );
}