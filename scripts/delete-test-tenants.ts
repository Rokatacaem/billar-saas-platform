import 'dotenv/config'; // Asegura que DATABASE_URL se cargue
import { prismaBase as prisma } from '../src/lib/prisma';

async function main() {
    console.log("🧹 Iniciando limpieza masiva de Tenants de prueba en Neon...");

    // 1. Identificar al tenant principal 'Akapoolco' para no borrarlo
    const mainTenant = await prisma.tenant.findUnique({
        where: { slug: 'akapoolco' },
        select: { id: true, name: true, slug: true }
    });

    if (!mainTenant) {
        console.warn("⚠️ No se encontró el tenant principal 'Akapoolco'.");
        console.warn("Si borramos todos los tenants, perderías el acceso completo al sistema.");
        console.warn("Abortando limpieza por seguridad.");
        return;
    }

    console.log(`🛡️ Conservando tenant administrativo: ${mainTenant.name}`);

    // 2. Encontrar todos los tenants EXCEPTO el principal
    const tenantsToDelete = await prisma.tenant.findMany({
        where: { id: { not: mainTenant.id } },
        select: { id: true, name: true, slug: true }
    });

    if (tenantsToDelete.length === 0) {
        console.log("✅ No hay tenants de prueba para eliminar. Todo está limpio.");
        return;
    }

    console.log(`🗑️ Se encontraron ${tenantsToDelete.length} tenants para eliminar.`);

    // 3. Eliminar usando raw SQL para evitar problemas de Foreign Keys / Cascade en Prisma
    // 3. Eliminar manualmente en orden para evitar problemas de Foreign Keys en NeonDB
    // Ya que Neon no permite 'SET session_replication_role' por seguridad.
    try {
        console.log(">> Ejecutando eliminación en cascada manual...");

        for (const tenant of tenantsToDelete) {
            console.log(`Borrando tenant: ${tenant.name} (${tenant.slug})...`);

            const tablessql = [
                `DELETE FROM "SystemLog" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "UsageLog" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "ServiceRequest" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "MaintenanceLog" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "StockMovement" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "TierChange" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "MembershipPayment" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "PaymentRecord" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "Member" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "MembershipPlan" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "DailyBalance" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "OrderItem" WHERE "productId" IN (SELECT id FROM "Product" WHERE "tenantId" = '${tenant.id}')`,
                `DELETE FROM "Recipe" WHERE "parentId" IN (SELECT id FROM "Product" WHERE "tenantId" = '${tenant.id}')`,
                `DELETE FROM "Table" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "Product" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "FolioRange" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "User" WHERE "tenantId" = '${tenant.id}'`,
                `DELETE FROM "Tenant" WHERE id = '${tenant.id}'`,
            ];

            for (const sql of tablessql) {
                await prisma.$executeRawUnsafe(sql).catch(e => {
                    // Ignorar tablas que no existan o no tengan datos, pero registrar el warn
                    // console.warn(`⚠️ Skip ${sql.split(' ')[2]}:`, (e as Error).message);
                });
            }
        }

        console.log(`✅ ¡Éxito! Se eliminaron ${tenantsToDelete.length} tenants de prueba de Neon.`);
        console.log(`🛡️ Se conservó el tenant maestro ('${mainTenant.slug}') para no perder el acceso.`);

    } catch (error) {
        // En caso de fallo crítico en crudo, restaurar la BD
        await prisma.$executeRawUnsafe(`SET session_replication_role = 'DEFAULT'`).catch(() => { });
        console.error("❌ Ocurrió un error al intentar eliminar los registros en cascada:", error);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Terminado.");
    });
