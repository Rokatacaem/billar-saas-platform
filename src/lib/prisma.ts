import { prismaClientSingleton } from './prisma-factory';

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

                // 🛡️ TENANT ISOLATION & RBAC (TEMPORALMENTE DESACTIVADO PARA DEBUG LOGIN)
                /* 
                let user: any = null;
                let tenantId: string | undefined;
                let role: string | undefined;

                try {
                    // Solo intentamos importar auth si no estamos en un proceso de inicialización crítica
                    // y si el modelo no es Tenant o User (que son usados por Auth.js)
                    if (model !== 'Tenant' && model !== 'User') {
                        const { auth } = await import("@/auth");
                        const session = await auth();
                        user = session?.user;
                        tenantId = user?.tenantId;
                        role = user?.role;
                    }
                } catch (authError) {
                    // Si falla la obtención de sesión, simplemente continuamos sin tenantId.
                    // Esto es común durante los flujos de login.
                    // console.log("Auth not available yet, bypassing extension logic");
                }
                */

                const user = null as any;
                const tenantId = undefined;
                const role = undefined;

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