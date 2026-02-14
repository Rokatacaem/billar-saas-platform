import { defineConfig } from '@prisma/config';
import 'dotenv/config'; // 👈 Esto cargará tu DATABASE_URL del archivo .env

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL,
    },
});