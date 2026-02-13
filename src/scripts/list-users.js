
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: {
                role: true,
                complex: true
            }
        });

        console.log('--- USER LIST ---');
        console.table(users.map(u => ({
            ID: u.id,
            Email: u.email,
            Role: u.role.name,
            Complex: u.complex ? u.complex.name : 'Global',
            Password: '123'
        })));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
