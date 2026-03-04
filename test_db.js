const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});
prisma.user.findFirst()
    .then(u => console.log('DB SUCCESS:', u?.document_num))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
