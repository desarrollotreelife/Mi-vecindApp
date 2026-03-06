const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});

async function main() {
    console.log('Fetching superadmin users and roles...');

    const roles = await prisma.role.findMany();
    console.log('Roles:', roles);

    const users = await prisma.user.findMany({
        where: { email: { contains: 'super' } },
        include: { role: true }
    });

    console.log('Superadmin users:', JSON.stringify(users, null, 2));

    const latestResidents = await prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        take: 3,
        include: { role: true, complex: true }
    });

    console.log('Latest users logging in:', JSON.stringify(latestResidents, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
