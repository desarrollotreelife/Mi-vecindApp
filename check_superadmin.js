const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});

async function checkSuperAdmin() {
    try {
        const roles = await prisma.role.findMany();
        console.log('All Roles:', roles.map(r => ({ id: r.id, name: r.name })));

        let superAdminRole = roles.find(r => r.name.toLowerCase() === 'superadmin');

        if (!superAdminRole) {
            console.log('Superadmin role not found. Creating it...');
            superAdminRole = await prisma.role.create({
                data: { name: 'superadmin' }
            });
        }

        const superAdmins = await prisma.user.findMany({
            where: { role_id: superAdminRole.id }
        });

        console.log('Super Admins found:', superAdmins.map(u => ({ id: u.id, document_num: u.document_num, name: u.full_name })));

        let targetUser = superAdmins[0];

        if (!targetUser) {
            console.log('No super admin found. Checking for "superadmin" document_num user to convert or create...');
            let existingUser = await prisma.user.findUnique({ where: { document_num: 'superadmin' } });

            const hashedPw = await bcrypt.hash('123456', 10);

            if (existingUser) {
                console.log('Converting existing "superadmin" user to superadmin role...');
                targetUser = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { role_id: superAdminRole.id, password_hash: hashedPw }
                });
            } else {
                console.log('Creating new "superadmin" user...');
                targetUser = await prisma.user.create({
                    data: {
                        document_num: 'superadmin',
                        email: 'superadmin@mivecindapp.com',
                        full_name: 'Super Administrador Global',
                        password_hash: hashedPw,
                        role_id: superAdminRole.id,
                        is_active: true
                    }
                });
            }
            console.log('SuperAdmin user created/updated with document_num: superadmin, password: 123456');
        } else {
            console.log('Resetting password for existing SuperAdmin:', targetUser.document_num);
            const hashedPw = await bcrypt.hash('123456', 10);
            await prisma.user.update({
                where: { id: targetUser.id },
                data: { password_hash: hashedPw }
            });
            console.log(`Password for ${targetUser.document_num} forced to 123456`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuperAdmin();
