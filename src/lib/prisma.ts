import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    // 🛡️ SAFEQUARD: Check for DATABASE_URL prevents hard crash on build/runtime if missing
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ CRITICAL: DATABASE_URL is missing. Prisma cannot connect.");
        // In production, this causes a crash. In dev, we might want to survive to show UI error.
        // We'll throw specific error that can be caught if wrapped, but here it's global.
        // Returning undefined or a mock might be safer to allow 'build' to pass even if env is missing.
        if (process.env.NODE_ENV === 'production') {
            // Log but don't crash thread immediately? 
            // Actually, next-auth needs it. 
        }
    }

    // Pool de conexiones optimizado para Neon
    // Ensure we don't pass undefined to Pool
    const pool = new Pool({
        connectionString: connectionString || "postgresql://user:pass@localhost:5432/db", // Fallback to avoid crash, will fail on query
        ssl: connectionString ? { rejectUnauthorized: false } : undefined
    });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({ adapter });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// 1. Create Base Client (Raw) - Used for NextAuth to avoid circular loop
export const prismaBase = globalThis.prismaGlobal ?? prismaClientSingleton();

// 2. Create Extended Client - Used by App for RBAC
export const prisma = prismaBase.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                // BYPASS for specific internal calls if needed, but separating clients is safer.

                // Obtención de sesión para aislamiento y RBAC
                // Dynamic import is safe here because auth() uses prismaBase
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

                // 🛡️ TENANT ISOLATION
                // Aislamiento automático por tenantId en todas las consultas
                if (tenantId && filterOperations.includes(operation)) {
                    const anyArgs = args as any;
                    // Asegurar que args.where existe
                    if (!anyArgs.where) anyArgs.where = {};

                    // Si ya tiene tenantId, no lo sobrescribimos (trust internal logic?) 
                    // Mejor: Forzarlo para seguridad.
                    // Excepto si es "superadmin" (future scope). 
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

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prismaBase;