import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@simids.com' } });
    console.log('Admin user:', admin?.email, 'Complex ID:', admin?.complex_id);

    const superadmin = await prisma.user.findFirst({ where: { role_id: 1 } }); // superadmin role?
    console.log('Superadmin user:', superadmin?.email, 'Complex ID:', superadmin?.complex_id);

    const products = await prisma.product.findMany({ take: 5 });
    console.log('Products sample:', products.map(p => ({ id: p.id, name: p.name, complex_id: p.complex_id })));
}

check().finally(() => prisma.$disconnect());
