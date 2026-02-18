
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Starting Database Backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
        // 1. Tenants
        const tenants = await prisma.tenant.findMany();
        console.log(`✅ Fetched ${tenants.length} tenants`);

        // 2. Users
        const users = await prisma.user.findMany();
        console.log(`✅ Fetched ${users.length} users`);

        // 3. Payment Records (Critical Financial Data)
        const payments = await prisma.paymentRecord.findMany();
        console.log(`✅ Fetched ${payments.length} payment records`);

        const backupData = {
            timestamp,
            tenants,
            users,
            payments
        };

        const filePath = path.join(backupDir, `backup-${timestamp}.json`);
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

        console.log(`💾 Backup saved to: ${filePath}`);

    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
