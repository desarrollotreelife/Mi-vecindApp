
import { prisma } from './src/core/prisma';

async function seedProducts() {
    console.log('Seeding products...');

    const products = [
        { name: 'Coca Cola 600ml', sku: 'DRNK-001', price: 1.50, current_stock: 50 },
        { name: 'Agua Cristal 500ml', sku: 'DRNK-002', price: 1.00, current_stock: 100 },
        { name: 'Papas Margarita Limón', sku: 'SNK-001', price: 2.00, current_stock: 20 },
        { name: 'Galletas Oreo', sku: 'SNK-002', price: 1.20, current_stock: 30 },
        { name: 'Cerveza Club Colombia', sku: 'ALC-001', price: 2.50, current_stock: 40 },
        { name: 'Choclitos', sku: 'SNK-003', price: 1.50, current_stock: 15 },
        { name: 'Gatorade Tropical', sku: 'DRNK-003', price: 2.80, current_stock: 25 },
        { name: 'Monster Energy', sku: 'DRNK-004', price: 3.50, current_stock: 10 }
    ];

    for (const p of products) {
        await prisma.product.upsert({
            where: { sku: p.sku },
            update: {},
            create: p
        });
    }

    console.log('Products seeded!');
}

seedProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
