import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const newPassword = '123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    console.log(`🔄 Updating all users to have password: ${newPassword}`);

    const result = await prisma.user.updateMany({
        data: {
            password_hash: hashedPassword
        }
    });

    console.log(`✅ Updated ${result.count} users successfully.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
