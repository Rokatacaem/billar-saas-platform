
import { prismaBase } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/security/encryption';

async function main() {
    const email = 'rodrigo@akapoolco.cl';
    const password = 'password123';

    console.log(`Setting password for ${email}...`);

    try {
        const hashedPassword = await hashPassword(password);

        await prismaBase.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log(`✅ Password updated successfully to: ${password}`);
    } catch (error) {
        console.error('❌ Error updating password:', error);
    }
}

main();
