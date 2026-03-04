import { StoreService } from './src/modules/store/store.service';
import { prisma } from './src/core/prisma';

async function testFetch() {
    try {
        const s = new StoreService();
        // Simulate user with complex_id = 1
        const prods = await s.listProducts(1);
        console.log(`StoreService returned ${prods.length} products`);
        if (prods.length > 0) {
            console.log(prods[0]);
        }

        // Check raw prisma
        const raw = await prisma.product.findMany();
        console.log(`Raw prisma returned ${raw.length} products`);

    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

testFetch();
