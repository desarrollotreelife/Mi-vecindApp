import { Request, Response } from 'express';
import { VotingService } from './voting.service';
import { prisma } from '../../core/prisma';

const votingService = new VotingService();

export const createSession = async (req: Request, res: Response) => {
    try {
        const result = await votingService.createSession(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getSessions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        const isAdmin = user?.role?.name === 'admin';

        const result = await votingService.getSessions(isAdmin);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const castVote = async (req: Request, res: Response) => {
    try {
        const { topicId, choice } = req.body;
        const userId = (req as any).user.id; // User from token

        // 1. Get Resident info to find Unit and Coefficient
        const resident = await prisma.resident.findUnique({
            where: { user_id: userId },
            include: { unit: true }
        });

        if (!resident) {
            return res.status(403).json({ error: 'Only residents can vote' });
        }

        const unitId = resident.unit_id;
        const coefficient = Number((resident.unit as any).coefficient);

        if (coefficient <= 0) {
            // Depending on strictness, we might block or allow with 0 weight
            // return res.status(400).json({ error: 'Unit has invalid coefficient' });
        }

        const result = await votingService.castVote(userId, topicId, choice, coefficient, unitId);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSessionStatus = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body; // 'open' or 'closed'

        let result;
        if (status === 'open') result = await votingService.activateSession(id);
        else if (status === 'closed') result = await votingService.closeSession(id);
        else return res.status(400).json({ error: 'Invalid status' });

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
