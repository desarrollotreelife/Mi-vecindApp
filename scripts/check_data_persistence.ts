import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Data Persistence ---');

    // 1. Voting Sessions
    const sessions = await prisma.votingSession.findMany({
        include: { topics: true }
    });
    console.log(`\n🗳️  Votaciones Encontradas: ${sessions.length}`);
    sessions.forEach(s => {
        console.log(` - [${s.status.toUpperCase()}] ID: ${s.id} | Título: "${s.title}" | Creada: ${s.created_at.toISOString().split('T')[0]}`);
    });

    // 2. Users check (Summary)
    const userCount = await prisma.user.count();
    console.log(`\n👥 Total Usuarios Registrados: ${userCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
