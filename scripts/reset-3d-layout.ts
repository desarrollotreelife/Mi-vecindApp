import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetLayout() {
    try {
        console.log('Resetting layout for complex ID 1...');
        await prisma.residentialComplex.update({
            where: { id: 1 },
            data: {
                layout_config: null
            }
        });
        console.log('Success: Layout config cleared. The 3D map will now use code defaults.');
    } catch (error) {
        console.error('Error resetting layout:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetLayout();
