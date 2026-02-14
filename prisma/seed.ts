// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Crear el Club Santiago (Modelo CLUB)
    const clubSantiago = await prisma.tenant.upsert({
        where: { slug: 'club-santiago' },
        update: {},
        create: {
            name: 'Club de Billar Santiago',
            slug: 'club-santiago',
            type: 'CLUB',
            primaryColor: '#1a4d2e', // Verde Billar
            secondaryColor: '#ffffff',
        },
    })

    // Crear Akapoolco (Modelo BUSINESS)
    const akapoolco = await prisma.tenant.upsert({
        where: { slug: 'akapoolco' },
        update: {},
        create: {
            name: 'Akapoolco Billar & Bar',
            slug: 'akapoolco',
            type: 'BUSINESS',
            primaryColor: '#0047ab', // Azul Cobalto
            secondaryColor: '#f8fafc',
        },
    })

    console.log('✅ Base de datos poblada con Club Santiago y Akapoolco')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })