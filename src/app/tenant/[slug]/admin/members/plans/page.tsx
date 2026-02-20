import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import MembershipPlanClient from './MembershipPlanClient';

export default async function PlansPage({ params }: { params: { slug: string } }) {
    const session = await auth();
    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') redirect('/login');

    const plans = await prisma.membershipPlan.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { price: 'asc' },
        include: { _count: { select: { members: true } } }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Estructura de Cuota Social</h1>
                    <p className="text-gray-500 text-sm mt-1">Configura las opciones de membresía, su precio y tratamiento de IVA. (SII Connect)</p>
                </div>
            </div>

            <MembershipPlanClient initialPlans={plans as any[]} />
        </div>
    );
}
