const { PrismaClient } = require('@prisma/client');

// Use the production database URL from the previous context summary
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});

async function main() {
    try {
        // Get the most recently created complex
        const latestComplex = await prisma.residentialComplex.findFirst({
            orderBy: { created_at: 'desc' },
            include: { users: true }
        });

        console.log("=== Latest Complex ===");
        console.log(latestComplex);

        // Check roles
        const roles = await prisma.role.findMany();
        console.log("\n=== Available Roles ===");
        console.log(roles);
    } catch (err) {
        console.error("Error connecting to DB:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
