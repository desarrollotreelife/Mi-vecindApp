import { prisma } from '../../core/prisma';
import { fileStorage } from '../../utils/fileStorage';
import bcrypt from 'bcryptjs';

export class ResidentsService {
    async listResidents(complexId: number, unitId?: number) {
        const where: any = {
            unit: { complex_id: complexId }
        };
        if (unitId) where.unit_id = unitId;

        const residents = await prisma.resident.findMany({
            where,
            include: {
                user: {
                    select: {
                        full_name: true,
                        email: true,
                        phone: true,
                        document_num: true,
                        profile_photo: true,
                        role: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                unit: true,
                vehicles: true,
            },
        });

        // Flatten structure for frontend
        return residents.map((r: any) => ({
            id: r.id,
            full_name: r.user.full_name,
            email: r.user.email,
            phone: r.user.phone,
            document_num: r.user.document_num,
            profile_photo: r.user.profile_photo,
            unit_number: r.unit?.block ? `${r.unit.block} - ${r.unit.number}` : r.unit?.number,
            unit_id: r.unit_id,
            type: r.type,
            role: r.user.role?.name || 'resident',
            vehicles: r.vehicles || [],
            biometric_descriptor: r.biometric_descriptor
        }));
    }

    async createResident(data: any, complexId?: number) {
        // Transactional creation
        return prisma.$transaction(async (tx: any) => {
            console.log('--- START CREATING RESIDENT ---');
            console.log('Input Data:', JSON.stringify(data, null, 2));

            // Save photo to local storage if provided
            let photoUrl = null;
            if (data.photo) {
                try {
                    const filename = `resident_${data.email.split('@')[0]}`;
                    photoUrl = await fileStorage.savePhoto(data.photo, 'residentes', filename);
                    console.log('Photo saved to:', photoUrl);
                } catch (error) {
                    console.error('Error saving photo:', error);
                    // Continue without photo
                }
            }

            // 1. Find or Create Unit
            let unitId;

            if (data.unit_id) {
                unitId = Number(data.unit_id);
            } else if (data.unit_number) {
                const parts = data.unit_number.split('-').map((s: string) => s.trim());
                let block = null;
                let number = data.unit_number;

                if (parts.length > 1) {
                    block = parts[0];
                    number = parts[1];
                }

                console.log(`Looking for unit: Block=${block}, Number=${number}`);

                const existingUnit = await tx.unit.findFirst({
                    where: {
                        number: number,
                        block: block,
                        complex_id: complexId || data.complex_id || null
                    }
                });

                if (existingUnit) {
                    console.log('Unit found:', existingUnit.id);
                    unitId = existingUnit.id;
                } else {
                    console.log('Creating new unit...');
                    const newUnit = await tx.unit.create({
                        data: {
                            type: 'apartment',
                            number: number,
                            block: block,
                            coefficient: data.coefficient ? Number(data.coefficient) : 0,
                            complex_id: complexId || data.complex_id || null
                        }
                    });
                    console.log('New unit created:', newUnit.id);
                    unitId = newUnit.id;
                }
            }

            if (!unitId) throw new Error('Unit identifier or number is required');

            // 2. Create User
            console.log(`Checking user document: ${data.document_num}`);
            let user = await tx.user.findUnique({ where: { document_num: data.document_num } });

            if (!user) {
                console.log('Creating new user...');

                // Determine Role ID dynamically
                let roleId = 3; // default: resident
                if (data.type === 'admin' || data.user_type === 'admin') roleId = 2;
                if (data.type === 'guard' || data.user_type === 'guard') roleId = 4;

                user = await tx.user.create({
                    data: {
                        email: data.email || null,
                        password_hash: data.password
                            ? await bcrypt.hash(data.password, 10)
                            : '$2b$10$iD8IJb/c.djo7wCteiojEO0r1kINOC1SaFfN4nbMc8XRv2lgdwf.u', // Valid hash for '123456'
                        full_name: data.full_name,
                        role_id: roleId,
                        phone: data.phone,
                        document_num: data.document_num,
                        profile_photo: photoUrl,
                        complex_id: complexId || data.complex_id || null
                    },
                });
                console.log('User created:', user.id);
            } else {
                console.log('User already exists:', user.id);
            }

            // 3. Create Resident linked to Unit
            console.log(`Creating resident link for User ${user.id} and Unit ${unitId}`);
            try {
                const resident = await tx.resident.create({
                    data: {
                        user_id: user.id,
                        unit_id: unitId,
                        type: data.type || 'owner',
                        biometric_descriptor: data.biometric_descriptor || null,
                    },
                });
                console.log('Resident created successfully:', resident.id);
                return resident;
            } catch (err: any) {
                console.error('Error creating resident link:', err);
                if (err.code === 'P2002') {
                    throw new Error('Este usuario ya está registrado como residente.');
                }
                throw err;
            }
        });
    }

    async updateResident(id: number, data: any, complexId?: number) {
        return prisma.$transaction(async (tx: any) => {
            console.log(`--- UPDATING RESIDENT ${id} ---`);
            const resident = await tx.resident.findUnique({
                where: { id },
                include: { user: true, unit: true }
            });

            if (!resident) throw new Error('Resident not found');

            // 1. Update Unit if changed
            let unitId = resident.unit_id;
            if (data.unit_id || data.unit_number) {
                if (data.unit_id) {
                    unitId = Number(data.unit_id);
                } else if (data.unit_number) {
                    // Check if same as current
                    const isSame = resident.unit.number === data.unit_number ||
                        `${resident.unit.block} - ${resident.unit.number}` === data.unit_number;

                    if (!isSame) {
                        const parts = data.unit_number.split('-').map((s: string) => s.trim());
                        let block = null;
                        let number = data.unit_number;

                        if (parts.length > 1) {
                            block = parts[0];
                            number = parts[1];
                        }

                        const existingUnit = await tx.unit.findFirst({
                            where: {
                                number: number,
                                block: block,
                                complex_id: complexId || resident.unit.complex_id
                            }
                        });

                        if (existingUnit) {
                            unitId = existingUnit.id;
                        } else {
                            const newUnit = await tx.unit.create({
                                data: {
                                    type: 'apartment',
                                    number,
                                    block,
                                    complex_id: complexId || resident.unit.complex_id
                                }
                            });
                            unitId = newUnit.id;
                        }
                    }
                }
            }

            // 2. Handle Photo Update
            let photoUrl = resident.user.profile_photo;
            if (data.photo && data.photo !== photoUrl && data.photo.startsWith('data:image')) {
                try {
                    const filename = `resident_${resident.user.email.split('@')[0]}`;
                    photoUrl = await fileStorage.savePhoto(data.photo, 'residentes', filename);
                } catch (error) {
                    console.error('Error updating photo:', error);
                }
            }

            // 3. Update User
            await tx.user.update({
                where: { id: resident.user_id },
                data: {
                    full_name: data.full_name,
                    email: data.email,
                    phone: data.phone,
                    document_num: data.document_num,
                    profile_photo: photoUrl,
                    // Update role if admin wants to change type to guard/admin
                    ...(data.user_type === 'admin' ? { role_id: 2 } :
                        data.user_type === 'guard' ? { role_id: 4 } : { role_id: 3 })
                }
            });

            // 4. Update Resident
            const updatedResident = await tx.resident.update({
                where: { id },
                data: {
                    unit_id: unitId,
                    type: data.type || resident.type,
                    biometric_descriptor: data.biometric_descriptor !== undefined ? data.biometric_descriptor : resident.biometric_descriptor,
                },
                include: { user: true }
            });

            return updatedResident;
        });
    }

    async deleteResident(id: number) {
        return prisma.$transaction(async (tx: any) => {
            const resident = await tx.resident.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!resident) throw new Error('Resident not found');

            // Delete resident record
            await tx.resident.delete({ where: { id } });

            return { message: 'Resident deleted successfully' };
        });
    }
}
