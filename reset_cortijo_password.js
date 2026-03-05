const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});

async function main() {
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);

        const user = await prisma.user.update({
            where: { id: 3 }, // Admin for Conjunto Residencial el Cortijo
            data: {
                password_hash: hashedPassword
            }
        });

        console.log("Password reset successfully for user:");
        console.log(`Document Number: ${user.document_num}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role ID: ${user.role_id}`);

    } catch (err) {
        console.error("Error connecting to DB:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
