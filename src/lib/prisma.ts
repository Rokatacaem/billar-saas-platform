import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Pool de conexiones optimizado para Neon
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({ adapter }).$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    // Obtención de sesión para aislamiento y RBAC
                    const { auth } = await import("@/auth");
                    const session = await auth();
                    const user = session?.user;
                    const tenantId = user?.tenantId;
                    const role = user?.role;

                    // 🛡️ RBAC: Protección de Modelos Sensibles
                    // Solo ADMIN puede modificar Tenant o User
                    if ((model === 'Tenant' || model === 'User') && ['update', 'delete', 'create', 'upsert'].includes(operation)) {
                        // Permitir creación de Tenant solo si es registro (no hay sesión o es system)
                        // Pero si hay sesión y no es ADMIN, bloquear.
                        if (user && role !== 'ADMIN') {
                            throw new Error(`⛔ RBAC: Role ${role} cannot perform ${operation} on ${model}`);
                        }
                    }

                    // 🚩 BYPASS: No filtramos tablas maestras por tenantId en lecturas (para login/auth)
                    if (model === 'Tenant' || model === 'User') {
                        return query(args);
                    }

                    // 🛡️ RBAC: Restricciones para MOZO
                    if (role === 'MOZO') {
                        // Mozo no puede borrar historial ni productos
                        if (['delete', 'deleteMany'].includes(operation)) {
                            throw new Error("⛔ RBAC: Mozo cannot delete records.");
                        }
                    }

                    const filterOperations = ['findMany', 'findFirst', 'findUnique', 'count', 'update', 'delete', 'updateMany', 'deleteMany'];

                    if (tenantId && filterOperations.includes(operation)) {
                        const anyArgs = args as any;
                        // Asegurar que args.where existe
                        if (!anyArgs.where) anyArgs.where = {};
                        anyArgs.where.tenantId = tenantId;
                    }

                    if (tenantId && (operation === 'create' || operation === 'createMany')) {
                        const anyArgs = args as any;
                        if (operation === 'create') {
                            if (!anyArgs.data) anyArgs.data = {};
                            anyArgs.data.tenantId = tenantId;
                        }
                    }

                    return query(args);
                },
            },
        },
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;