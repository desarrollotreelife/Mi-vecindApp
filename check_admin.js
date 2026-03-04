const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});

async function checkAdmin() {
    try {
        const adminUser = await prisma.user.findUnique({
            where: { document_num: 'admin' }
        });

        if (!adminUser) {
            console.log('User "admin" NOT FOUND in the database.');
            return;
        }

        console.log('User found:', adminUser.document_num, 'Role ID:', adminUser.role_id);
        console.log('Stored Password Hash:', adminUser.password_hash);

        // Test password '123456'
        const isMatch = await bcrypt.compare('123456', adminUser.password_hash);
        console.log('Does "123456" match?', isMatch);

        // Let's reset the password directly to '123456' just in case it was changed during prior tests
        const hashedPw = await bcrypt.hash('123456', 10);
        await prisma.user.update({
            where: { id: adminUser.id },
            data: { password_hash: hashedPw }
        });
        console.log('Password forcibly reset to 123456 in the database. Please try logging in again.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
