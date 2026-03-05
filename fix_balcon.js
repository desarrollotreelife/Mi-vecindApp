const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});

async function main() {
    try {
        await prisma.user.update({
            where: { id: 5 }, // Admin for BALCON DE LAS AMERICAS
            data: {
                role_id: 1 // Fix role to Admin
            }
        });
        console.log("Fixed user 5 (Balcon de las Americas) -> Role Admin");
    } catch (err) {
        console.error("Error connecting to DB:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
