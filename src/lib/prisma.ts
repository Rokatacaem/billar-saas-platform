import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth"; // Lo configuraremos en el siguiente paso

export const prisma = new PrismaClient().$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const session = await auth();
                const tenantId = session?.user?.tenantId;

                // Si hay un tenantId en la sesión, lo inyectamos automáticamente en los filtros
                if (tenantId && ['findMany', 'findFirst', 'count', 'update', 'delete'].includes(operation)) {
                    args.where = { ...args.where, tenantId };
                }

                return query(args);
            },
        },
    },
});