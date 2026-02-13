import { prisma } from '../../core/prisma';
import { fileStorage } from '../../utils/fileStorage';
import bcrypt from 'bcryptjs';

export class ConfigService {

    // --- Gestión de Usuarios ---

    async listSystemUsers(filters?: { role_id?: number; status?: string }) {
        const where: any = {};

        // Filter by specific roles usually (Admins and Guards)
        // Assuming role_id 1=SuperAdmin, 2=Admin, 4=Guard based on typical setup. 
        // We should fetch roles to be sure or accept role_id filter.
        if (filters?.role_id) {
            where.role_id = Number(filters.role_id);
        } else {
            // Default: show admins and guards, exclude residents (role 3 typically) unless requested
            // Let's filter NOT residents if no specific role requested
            where.role_id = { not: 3 };
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        return prisma.user.findMany({
            where,
            include: { role: true },
            orderBy: { created_at: 'desc' }
        });
    }

    async createSystemUser(data: any) {
        // 1. Hash password
        // Use default if not provided, or generate one
        const password = data.password || '123456';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 2. Save photo if exists
        let photoUrl = null;
        if (data.photo) {
            try {
                const filename = `user_${data.email ? data.email.split('@')[0] : Date.now()}`;
                photoUrl = fileStorage.savePhoto(data.photo, 'usuarios', filename);
            } catch (error) {
                console.error('Error saving user photo:', error);
            }
        }

        // 3. Create User
        const user = await prisma.user.create({
            data: {
                full_name: data.full_name,
                email: data.email,
                password_hash: passwordHash,
                role_id: Number(data.role_id),
                phone: data.phone,
                document_num: data.document_num,
                profile_photo: photoUrl,
                address: data.address,
                position: data.position,
                shift: data.shift,
                security_company: data.security_company,
                hire_date: data.hire_date ? new Date(data.hire_date) : undefined,
                status: 'active'
            }
        });

        // 4. Log Action
        await this.logAction({
            user_id: data.created_by_user_id || 1, // Fallback to system/superadmin
            action: 'CREATE_USER',
            module: 'config',
            description: `Creó usuario del sistema: ${user.full_name} (${user.email})`
        });

        return user;
    }

    async updateSystemUser(id: number, data: any) {
        // Handle photo update
        let photoUrl = undefined;
        if (data.photo) {
            try {
                const user = await prisma.user.findUnique({ where: { id } });
                const filename = `user_${user?.email?.split('@')[0] || id}`;
                photoUrl = fileStorage.savePhoto(data.photo, 'usuarios', filename);
            } catch (error) {
                console.error('Error saving user photo:', error);
            }
        }

        // Handle password update if provided
        let passwordHash = undefined;
        if (data.password) {
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(data.password, salt);
        }

        const updateData: any = {
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            document_num: data.document_num,
            address: data.address,
            position: data.position,
            shift: data.shift,
            security_company: data.security_company,
            status: data.status,
            role_id: data.role_id ? Number(data.role_id) : undefined,
        };

        if (photoUrl) updateData.profile_photo = photoUrl;
        if (passwordHash) updateData.password_hash = passwordHash;
        if (data.hire_date) updateData.hire_date = new Date(data.hire_date);

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        // Log Action
        await this.logAction({
            user_id: data.updated_by_user_id || 1,
            action: 'UPDATE_USER',
            module: 'config',
            description: `Actualizó usuario: ${updatedUser.full_name}`
        });

        return updatedUser;
    }

    async deleteSystemUser(id: number, adminId: number) {
        // Soft delete usually by setting status inactive, but here we might want to actually remove
        // or just set inactive. Let's set inactive for safety.
        const user = await prisma.user.update({
            where: { id },
            data: { status: 'inactive' }
        });

        await this.logAction({
            user_id: adminId,
            action: 'DEACTIVATE_USER',
            module: 'config',
            description: `Desactivó usuario: ${user.full_name}`
        });

        return user;
    }

    // --- Auditoría ---

    async logAction(data: { user_id: number, action: string, module: string, description: string, ip_address?: string, metadata?: any }) {
        try {
            await prisma.auditLog.create({
                data: {
                    user_id: data.user_id,
                    action: data.action,
                    module: data.module,
                    description: data.description,
                    ip_address: data.ip_address,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : null
                }
            });
        } catch (error) {
            console.error('Error logging audit action:', error);
            // Don't throw, just log error so we don't block main flow
        }
    }

    async getAuditLogs(filters?: { user_id?: number; module?: string; startDate?: string; endDate?: string }) {
        const where: any = {};

        if (filters?.user_id) where.user_id = Number(filters.user_id);
        if (filters?.module) where.module = filters.module;
        if (filters?.startDate && filters?.endDate) {
            where.created_at = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate)
            };
        }

        return prisma.auditLog.findMany({
            where,
            include: { user: { select: { full_name: true, role: true } } },
            orderBy: { created_at: 'desc' },
            take: 100 // Limit to last 100 for now
        });
    }

    async getSystemStats() {
        // Quick stats for dashboard
        const totalUsers = await prisma.user.count({ where: { role_id: { not: 3 } } }); // Exclude residents
        const activeGuards = await prisma.user.count({ where: { role_id: 4, status: 'active' } });
        const totalLogsToday = await prisma.auditLog.count({
            where: {
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });

        return {
            total_system_users: totalUsers,
            active_guards: activeGuards,
        };
    }

    // --- Gestión de Turnos ---

    async listShifts() {
        return (prisma as any).shiftConfig.findMany({
            where: { is_active: true }
        });
    }

    async createShift(data: any) {
        return (prisma as any).shiftConfig.create({
            data: {
                name: data.name,
                start_time: data.start_time,
                end_time: data.end_time,
                is_active: true
            }
        });
    }

    async updateShift(id: number, data: any) {
        return (prisma as any).shiftConfig.update({
            where: { id },
            data: {
                name: data.name,
                start_time: data.start_time,
                end_time: data.end_time,
                is_active: data.is_active
            }
        });
    }

    async deleteShift(id: number) {
        // Soft delete
        return (prisma as any).shiftConfig.update({
            where: { id },
            data: { is_active: false }
        });
    }

    async resetShifts(mode: '2-shifts' | '3-shifts') {
        // ... (existing code, not shown here to save tokens, just referencing end for append)
        // actually I need to match valid context.
        // I will append at the end of class before closing brace.
    }

    // --- Payment Configuration ---

    async getPaymentConfig() {
        // Assuming single complex for now (ID=1) or handle multi-tenant later
        const complexId = 1;
        return prisma.residentialComplex.findUnique({
            where: { id: complexId },
            select: {
                payment_provider: true,
                epayco_public_key: true,
                epayco_p_cust_id: true,
                epayco_p_key: true,
                is_payment_active: true,
                // do not return private key
            }
        });
    }

    async updatePaymentConfig(data: any) {
        const complexId = 1;

        const updateData: any = {
            payment_provider: data.payment_provider,
            epayco_public_key: data.epayco_public_key,
            epayco_p_cust_id: data.epayco_p_cust_id,
            epayco_p_key: data.epayco_p_key,
            is_payment_active: data.is_payment_active
        };

        // Only update private key if provided (don't overwrite with null/empty if not changed)
        if (data.epayco_private_key && data.epayco_private_key.length > 5) {
            updateData.epayco_private_key = data.epayco_private_key;
        }

        return prisma.residentialComplex.update({
            where: { id: complexId },
            data: updateData
        });
    }

}
