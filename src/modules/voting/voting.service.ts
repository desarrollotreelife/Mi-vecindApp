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

    async castVote(userId: number, topicId: number, choice: string, coefficient: number, unitId: number, residentId: number) {
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

        // Find the topic to know the session_id
        const topic = await (prisma as any).voteTopic.findUnique({
            where: { id: topicId },
            select: { session_id: true }
        });

        if (!topic) throw new Error('Topic not found');

        // Verify if resident is in attendance
        const attendance = await (prisma as any).votingAttendance.findUnique({
            where: {
                session_id_resident_id: {
                    session_id: topic.session_id,
                    resident_id: residentId
                }
            }
        });

        if (!attendance) {
            throw new Error('Resident is not in the attendance list for this session. Cannot vote.');
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

    // --- Attendance Methods ---

    async getAttendance(sessionId: number) {
        return (prisma as any).votingAttendance.findMany({
            where: { session_id: sessionId },
            include: {
                resident: {
                    include: {
                        user: { select: { full_name: true, email: true } },
                        unit: { select: { number: true, block: true } }
                    }
                }
            }
        });
    }

    async addAttendance(sessionId: number, residentId: number) {
        return (prisma as any).votingAttendance.create({
            data: {
                session_id: sessionId,
                resident_id: residentId
            }
        });
    }

    async removeAttendance(sessionId: number, residentId: number) {
        return (prisma as any).votingAttendance.delete({
            where: {
                session_id_resident_id: {
                    session_id: sessionId,
                    resident_id: residentId
                }
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
