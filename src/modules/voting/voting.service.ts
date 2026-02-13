import { prisma } from '../../core/prisma';

export class VotingService {
    async createSession(data: any) {
        return (prisma as any).votingSession.create({
            data: {
                title: data.title,
                description: data.description,
                start_date: new Date(data.start_date),
                end_date: data.end_date ? new Date(data.end_date) : null,
                type: data.type,
                status: 'draft',
                topics: {
                    create: data.topics.map((t: any) => ({
                        question: t.question,
                        options: JSON.stringify(t.options)
                    }))
                }
            },
            include: { topics: true }
        });
    }

    async getSessions(isAdmin = false) {
        // Residents see Open and Closed (results). Admin sees everything.
        const where = isAdmin ? {} : { status: { in: ['open', 'closed'] } };
        return (prisma as any).votingSession.findMany({
            where,
            include: {
                topics: {
                    include: { votes: true } // Include votes to calculate results
                }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async castVote(userId: number, topicId: number, choice: string, coefficient: number, unitId: number) {
        // Validation: Check if user already voted for this topic
        const existingVote = await (prisma as any).vote.findFirst({
            where: {
                topic_id: topicId,
                unit_id: unitId
            }
        });

        if (existingVote) {
            throw new Error('Vote already cast for this unit.');
        }

        return (prisma as any).vote.create({
            data: {
                topic_id: topicId,
                unit_id: unitId,
                user_id: userId,
                choice,
                coefficient
            }
        });
    }

    async activateSession(id: number) {
        return (prisma as any).votingSession.update({
            where: { id },
            data: { status: 'open' }
        });
    }

    async closeSession(id: number) {
        return (prisma as any).votingSession.update({
            where: { id },
            data: { status: 'closed' }
        });
    }
}
