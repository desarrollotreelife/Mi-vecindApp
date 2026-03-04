import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, document_num: true, full_name: true }
    });
    console.log(users);

    // Assign dummy doc num to those who don't have one so we don't break the DB when making the field required
    let assigned = 0;
    for (const u of users) {
        if (!u.document_num) {
            const fakeDoc = u.email === 'admin' ? 'admin' : `DOC_PENDING_${u.id}`;
            await prisma.user.update({
                where: { id: u.id },
                data: { document_num: fakeDoc }
            });
            assigned++;
            console.log(`Assigned ${fakeDoc} to ${u.email}`);
        }
    }
}

checkUsers().finally(() => prisma.$disconnect());
