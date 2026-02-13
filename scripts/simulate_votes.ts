import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Simulating votes...');

    // Get Open Session
    const session = await prisma.votingSession.findFirst({
        where: { status: 'open' },
        include: { topics: true }
    });

    if (!session) {
        console.log('No open session found.');
        return;
    }

    // Get Units
    const units = await prisma.unit.findMany();
    if (units.length === 0) {
        console.log('No units found.');
        return;
    }

    // Get Admin User (as a dummy user for the record, or create mock users)
    // For simulation, we'll just link to the first found user or admin to avoid FK errors,
    // OR we should ideally have residents.
    // Let's check users.
    const admin = await prisma.user.findFirst();
    if (!admin) {
        console.log('No users found.');
        return;
    }

    console.log(`Voting in session: ${session.title}`);

    for (const topic of session.topics) {
        const options = JSON.parse(topic.options);
        console.log(`Topic: ${topic.question}`);

        // Randomly vote for 60% of units
        for (const unit of units) {
            if (Math.random() > 0.4) {
                const choice = options[Math.floor(Math.random() * options.length)];
                const coefficient = unit.coefficient || 0;

                try {
                    await prisma.vote.create({
                        data: {
                            topic_id: topic.id,
                            unit_id: unit.id,
                            user_id: admin.id, // Mock user, in reality would be resident's user
                            choice: choice,
                            coefficient: coefficient
                        }
                    });
                    // console.log(`Unit ${unit.number} voted: ${choice}`);
                } catch (e) {
                    // Ignore duplicate votes if re-running
                }
            }
        }
    }

    console.log('Simulation complete. Refresh the page to see results.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
