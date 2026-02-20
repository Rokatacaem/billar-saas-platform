import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TaxConfigPanel from './TaxConfigPanel';
import LegalConfigPanel from './LegalConfigPanel';

export default async function SettingsPage({ params }: { params: { slug: string } }) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') redirect('/login');

    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: {
            name: true,
            taxRate: true,
            taxName: true,
            isTaxExempt: true,
            currencyCode: true,
            currencySymbol: true,
            rutEmisor: true,
            razonSocial: true,
            giro: true,
            direccionTributaria: true,
        },
    });

    if (!tenant) redirect('/login');

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-black text-gray-900">⚙️ Configuración del Tenant</h1>
                <p className="text-gray-500 text-sm mt-1">{tenant.name}</p>
            </div>

            <LegalConfigPanel
                currentRutEmisor={tenant.rutEmisor ?? ''}
                currentRazonSocial={tenant.razonSocial ?? ''}
                currentGiro={tenant.giro ?? ''}
                currentDirTributaria={tenant.direccionTributaria ?? ''}
            />

            <TaxConfigPanel
                currentTaxPercentage={Math.round((tenant.taxRate ?? 0.19) * 100)}
                currentTaxName={tenant.taxName ?? 'IVA'}
                currentIsTaxExempt={tenant.isTaxExempt ?? false}
                currencyCode={tenant.currencyCode ?? 'CLP'}
            />
        </div>
    );
}
