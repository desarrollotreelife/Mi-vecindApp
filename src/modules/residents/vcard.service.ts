import jwt from 'jsonwebtoken';
import { prisma } from '../../core/prisma';

const VCARD_SECRET = process.env.VCARD_SECRET || 'vcard_super_secret_for_residents';

export class VCardService {
    async generateToken(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });

        if (!user) throw new Error('User not found');

        // Logic for RESIDENT
        if (user.role.name === 'resident') {
            const resident = await prisma.resident.findFirst({
                where: { user_id: userId },
                include: { unit: true }
            });

            if (!resident) throw new Error('Resident data not found');

            const payload = {
                id: resident.id,
                uid: user.id,
                cid: user.complex_id,
                name: user.full_name,
                unit: resident.unit ? `${resident.unit.block || ''} ${resident.unit.number}`.trim() : 'N/A',
                type: 'vcard_auth',
                identity_type: 'resident'
            };

            return jwt.sign(payload, VCARD_SECRET, { expiresIn: '60s' });
        }

        // Logic for VISITOR
        if (user.role.name === 'visitor') {
            const visitor = await prisma.visitor.findUnique({
                where: { document_num: user.document_num || '' },
                include: {
                    visits: {
                        where: { status: { in: ['pending', 'active'] } },
                        include: { resident: { include: { unit: true, user: true } } },
                        orderBy: { scheduled_entry: 'desc' },
                        take: 1
                    }
                }
            });

            if (!visitor) throw new Error('Visitor record not found in system');

            const activeVisit = visitor.visits[0];
            const payload = {
                id: visitor.id,
                uid: user.id,
                cid: user.complex_id,
                name: user.full_name,
                unit: activeVisit ? `${activeVisit.resident.unit.block || ''} ${activeVisit.resident.unit.number}`.trim() : 'Sin Visita Activa',
                destination: activeVisit ? `Apto de ${activeVisit.resident.user.full_name}` : 'N/A',
                type: 'vcard_auth',
                identity_type: 'visitor'
            };

            return jwt.sign(payload, VCARD_SECRET, { expiresIn: '60s' });
        }

        throw new Error('Identification not available for this role');
    }

    async verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token, VCARD_SECRET) as any;
            if (decoded.type !== 'vcard_auth') throw new Error('Invalid token type');

            if (decoded.identity_type === 'visitor') {
                const visitor = await prisma.visitor.findUnique({
                    where: { id: decoded.id }
                });
                if (!visitor) throw new Error('Visitor no longer in system');
                return {
                    ...decoded,
                    photo: visitor.photo_url,
                    phone: 'Visitor'
                };
            }

            // Default: resident
            const resident = await prisma.resident.findUnique({
                where: { id: decoded.id },
                include: { user: true, unit: true }
            });

            if (!resident || !resident.user || !resident.user.is_active) throw new Error('Resident no longer active');

            return {
                ...decoded,
                photo: resident.user.profile_photo,
                phone: resident.user.phone
            };
        } catch (error) {
            throw new Error('QR Expirado o Inválido');
        }
    }
}
