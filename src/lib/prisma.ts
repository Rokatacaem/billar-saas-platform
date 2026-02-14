import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prismaClientSingleton = () => {
    return new PrismaClient().$extends({
        query: {
            $allOperations({ model, operation, args, query }) {
                return (async () => {
                    const session = await auth();
                    const tenantId = session?.user?.tenantId;

                    // Operaciones que requieren inyección de filtro por tenantId
                    const filterOperations = ['findMany', 'findFirst', 'count', 'update', 'delete', 'updateMany', 'deleteMany'];

                    if (tenantId && filterOperations.includes(operation)) {
                        // Forzamos el tipo para que TS permita manipular 'where' de forma segura
                        const anyArgs = args as any;
                        anyArgs.where = { ...anyArgs.where, tenantId };
                    }

                    // Para la creación, aseguramos que el registro pertenezca al tenant
                    if (tenantId && operation === 'create') {
                        const anyArgs = args as any;
                        anyArgs.data = { ...anyArgs.data, tenantId };
                    }

                    return query(args);
                })();
            },
        },
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;