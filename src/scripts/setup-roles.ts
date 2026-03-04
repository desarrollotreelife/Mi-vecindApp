import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Setting up Roles and Users...');

    // 1. Ensure Complex exists
    const complex = await prisma.residentialComplex.findFirst();
    if (!complex) {
        console.error('❌ No complex found. Run seed first.');
        return;
    }
    const complexId = complex.id;

    // 2. Roles Setup
    const roles = [
        { id: 1, name: 'superadmin' },
        { id: 2, name: 'admin' },
        { id: 3, name: 'resident' },
        { id: 4, name: 'guard' },
        { id: 5, name: 'visitor' },
        { id: 6, name: 'propietario' },
        { id: 7, name: 'residente_propietario' }
    ];

    for (const r of roles) {
        await prisma.role.upsert({
            where: { id: r.id },
            update: { name: r.name },
            create: { id: r.id, name: r.name }
        });
    }
    console.log('✅ Roles established.');

    // 3. User Credentials Data
    const passwordHash = await bcrypt.hash('123456', 10);
    const testUsers = [
        { email: 'superadmin1', full_name: 'Super Administrador', role_id: 1 },
        { email: 'admin2', full_name: 'Administrador de Conjunto', role_id: 2 },
        { email: 'sebastian', full_name: 'Sebastián (Residente)', role_id: 3 },
        { email: 'guardia1', full_name: 'Guardia de Seguridad', role_id: 4 },
        { email: 'visitante1', full_name: 'Visitante Demo', role_id: 5 }
    ];

    for (const u of testUsers) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password_hash: passwordHash,
                role_id: u.role_id,
                complex_id: complexId,
                document_num: u.email === 'visitante1' ? '123456789' : undefined
            },
            create: {
                email: u.email,
                password_hash: passwordHash,
                full_name: u.full_name,
                role_id: u.role_id,
                complex_id: complexId,
                document_num: u.email === 'visitante1' ? '123456789' : u.email
            }
        });
    }

    // 4. Link Resident Data for Sebastian
    const sebastian = await prisma.user.findUnique({ where: { email: 'sebastian' } });
    const unit = await prisma.unit.findFirst();
    if (sebastian && unit) {
        await prisma.resident.upsert({
            where: { user_id: sebastian.id },
            update: { unit_id: unit.id },
            create: { user_id: sebastian.id, unit_id: unit.id, type: 'owner' }
        });
    }

    // 5. Create Visitor Data for visitante1
    const visitorUser = await prisma.user.findUnique({ where: { email: 'visitante1' } });
    if (visitorUser && unit) {
        const visitorRecord = await prisma.visitor.upsert({
            where: { document_num: '123456789' },
            update: { name: 'Visitante Demo' },
            create: { name: 'Visitante Demo', document_num: '123456789' }
        });

        // Add a visit
        const resident = await prisma.resident.findFirst({ where: { user: { email: 'sebastian' } } });
        if (resident) {
            await (prisma as any).visit.create({
                data: {
                    visitor_id: visitorRecord.id,
                    resident_id: resident.id,
                    scheduled_entry: new Date(),
                    status: 'pending',
                    qr_token: 'v_demo_123'
                }
            });
        }
    }

    console.log('✨ All 5 roles and users are ready with password: 123456');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
