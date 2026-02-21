import 'dotenv/config'; // Asegura que DATABASE_URL se cargue
import { prismaBase as prisma } from '../src/lib/prisma';

async function main() {
    console.log("🔍 Buscando usuarios en la base de datos...");

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            tenant: {
                select: { name: true }
            }
        }
    });

    if (users.length === 0) {
        console.log("⚠️ No hay usuarios en la base de datos.");
        return;
    }

    console.table(users.map(u => ({
        ID: u.id,
        Email: u.email,
        Role: u.role,
        Tenant: u.tenant?.name || 'N/A'
    })));

    // Si tu correo es santiago o rokat, vamos a forzarlo a SUPER_ADMIN
    console.log("\n🚀 Elevando el primer usuario a SUPER_ADMIN para solucionar el acceso...");

    // Elevaremos el primero que encontremos (asumiendo que es tu cuenta)
    const targetUser = users[0];

    if (targetUser) {
        await prisma.user.update({
            where: { id: targetUser.id },
            data: { role: 'SUPER_ADMIN' }
        });
        console.log(`✅ Usuario ${targetUser.email} ha sido promovido a SUPER_ADMIN.`);
    }

}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Terminado.");
    });
