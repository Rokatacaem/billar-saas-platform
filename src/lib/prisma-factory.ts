import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

export const prismaClientSingleton = () => {
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

    return new PrismaClient({ adapter });
};
