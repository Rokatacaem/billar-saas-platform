import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AppearanceClient from './AppearanceClient';

export default async function AppearancePage({ params }: { params: { slug: string } }) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') redirect('/login');

    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: {
            id: true,
            uiConfig: true
        },
    });

    if (!tenant) redirect('/login');

    const currentUiConfig = (tenant.uiConfig as { id?: string }) || {};

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-black text-gray-900">🎨 Configuración de Apariencia Elite</h1>
                <p className="text-gray-500 text-sm mt-1">Selecciona la inmersión visual para tu recinto.</p>
            </div>

            <AppearanceClient
                tenantId={tenant.id}
                currentThemeId={currentUiConfig?.id || 'classic'}
            />
        </div>
    );
}
