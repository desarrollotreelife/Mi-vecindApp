
import { prisma } from '../../core/prisma';

export class SaasService {

    // Listar todos los conjuntos con su estado de suscripción
    async listComplexes() {
        return prisma.residentialComplex.findMany({
            include: {
                _count: {
                    select: { units: true, users: true }
                }
            },
            orderBy: { id: 'desc' }
        });
    }

    // Crear un nuevo conjunto (Wizard)
    async createComplex(data: any) {
        return prisma.residentialComplex.create({
            data: {
                name: data.name,
                nit: data.nit,
                address: data.address,
                phone: data.phone,
                city: data.city,
                // Default settings
                subscription_status: 'active',
                plan_type: data.plan_type || 'standard',
                billing_due_date: new Date(new Date().setDate(new Date().getDate() + 30)) // +30 days
            }
        });
    }

    // "Kill Switch": Activar o Desactivar acceso al conjunto
    async toggleStatus(complexId: number, isActive: boolean) {
        return prisma.residentialComplex.update({
            where: { id: complexId },
            data: {
                is_active: isActive,
                // Si se desactiva, podríamos cambiar el estado de suscripción también
                subscription_status: isActive ? 'active' : 'suspended'
            }
        });
    }

    // Actualizar información de facturación (SaaS)
    async updateSubscription(complexId: number, data: { status?: string, dueDate?: Date, plan?: string }) {
        return prisma.residentialComplex.update({
            where: { id: complexId },
            data: {
                subscription_status: data.status,
                billing_due_date: data.dueDate,
                plan_type: data.plan
            }
        });
    }

    // Registrar un pago del conjunto a la plataforma SaaS
    async recordPayment(complexId: number, amount: number, method: string, reference?: string) {
        // Aquí podríamos tener una tabla real de 'SaasPayments', 
        // por ahora actualizamos la fecha de último pago y extendemos la fecha de corte.

        const complex = await prisma.residentialComplex.findUnique({ where: { id: complexId } });
        if (!complex) throw new Error('Conjunto no encontrado');

        const newDueDate = new Date(complex.billing_due_date || new Date());
        newDueDate.setMonth(newDueDate.getMonth() + 1); // +1 Mes de suscripción

        return prisma.residentialComplex.update({
            where: { id: complexId },
            data: {
                last_payment_date: new Date(),
                billing_due_date: newDueDate,
                subscription_status: 'active'
            }
        });
    }

    // Enviar alerta de cobro (Simulado por ahora)
    async sendPaymentAlert(complexId: number) {
        const complex = await prisma.residentialComplex.findUnique({
            where: { id: complexId },
            include: { users: { where: { role: { name: 'admin' } } } } // Buscar admins
        });

        if (!complex) throw new Error('Conjunto no encontrado');

        // Simulación de envío de correo
        console.log(`[SaaS Alert] Enviando alerta de cobro a ${complex.name} (Vence: ${complex.billing_due_date})`);

        // Retornar lista de admins contactados
        return {
            sent: true,
            admins_contacted: complex.users.map(u => u.email),
            message: `Alerta enviada para fecha de corte ${complex.billing_due_date}`
        };
    }
}
