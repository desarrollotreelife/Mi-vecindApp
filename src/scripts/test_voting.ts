import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVotingErrors() {
    try {
        const sessions = await prisma.votingSession.findMany({
            include: {
                topics: {
                    include: {
                        votes: true
                    }
                },
                attendances: true
            }
        });

        console.log("Current Sessions:");
        console.dir(sessions, { depth: null });
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkVotingErrors();
