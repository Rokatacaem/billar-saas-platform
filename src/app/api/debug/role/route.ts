import { NextResponse } from 'next/server';
import { prismaBase as prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const email = 'rodrigo@akapoolco.cl';

        // Buscar e imprimir todos los usuarios
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true }
        });

        // Buscar al usuario específico y elevarlo
        const updated = await prisma.user.updateMany({
            where: { email },
            data: { role: 'SUPER_ADMIN' }
        });

        const userNow = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, role: true }
        });

        return NextResponse.json({
            message: "Verificación y Promoción completada",
            updatedCount: updated.count,
            targetUser: userNow,
            allUsers: users
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
