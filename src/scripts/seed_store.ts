import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
    // Gaseosas Postobón
    { name: 'Postobón Manzana 400ml', sku: 'POS-MAN-400', price: 2500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/E81123/FFFFFF?text=Postobon+Manzana' },
    { name: 'Postobón Colombiana 400ml', sku: 'POS-COL-400', price: 2500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/FF8C00/FFFFFF?text=Colombiana' },
    { name: 'Postobón Uva 400ml', sku: 'POS-UVA-400', price: 2500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/68217A/FFFFFF?text=Postobon+Uva' },
    { name: 'Postobón Naranja 400ml', sku: 'POS-NAR-400', price: 2500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/FF9900/FFFFFF?text=Postobon+Naranja' },
    { name: 'Postobón Limón 400ml', sku: 'POS-LIM-400', price: 2500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/00CC66/FFFFFF?text=Postobon+Limon' },
    { name: 'Gaseosa Popular 1.5L', sku: 'POS-POP-1500', price: 4500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/8B4513/FFFFFF?text=Popular' },
    { name: 'Postobón Manzana 1.5L', sku: 'POS-MAN-1500', price: 4500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/E81123/FFFFFF?text=Postobon+Manzana+1.5L' },
    { name: 'Postobón Colombiana 1.5L', sku: 'POS-COL-1500', price: 4500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/FF8C00/FFFFFF?text=Colombiana+1.5L' },

    // Gaseosas Coca-Cola
    { name: 'Coca-Cola Original 400ml', sku: 'CC-ORIG-400', price: 3000, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/E50014/FFFFFF?text=Coca-Cola' },
    { name: 'Coca-Cola Sin Azúcar 400ml', sku: 'CC-SAZ-400', price: 3000, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/000000/FFFFFF?text=Coca-Cola+Zero' },
    { name: 'Coca-Cola Original 1.5L', sku: 'CC-ORIG-1500', price: 6000, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/E50014/FFFFFF?text=Coca-Cola+1.5L' },
    { name: 'Sprite 400ml', sku: 'CC-SPR-400', price: 2800, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/009933/FFFFFF?text=Sprite' },
    { name: 'Quatro 400ml', sku: 'CC-QUA-400', price: 2800, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/FFFF00/000000?text=Quatro' },
    { name: 'Premio 400ml', sku: 'CC-PRE-400', price: 2800, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/FF0000/FFFFFF?text=Premio' },

    // Big Cola
    { name: 'Big Cola 400ml', sku: 'BIG-COL-400', price: 1500, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/8B0000/FFFFFF?text=Big+Cola' },
    { name: 'Big Cola 1.5L', sku: 'BIG-COL-1500', price: 3000, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/8B0000/FFFFFF?text=Big+Cola+1.5L' },
    { name: 'Big Cola 3.3L', sku: 'BIG-COL-3300', price: 5000, category: 'Gaseosas', image_url: 'https://placehold.co/400x400/8B0000/FFFFFF?text=Big+Cola+3.3L' },

    // Jugos Hit & Aguas
    { name: 'Jugo Hit Lulo 237ml', sku: 'HIT-LUL-237', price: 1800, category: 'Jugos', image_url: 'https://placehold.co/400x400/228B22/FFFFFF?text=Hit+Lulo' },
    { name: 'Jugo Hit Mango 237ml', sku: 'HIT-MAN-237', price: 1800, category: 'Jugos', image_url: 'https://placehold.co/400x400/FFD700/000000?text=Hit+Mango' },
    { name: 'Jugo Hit Mora 237ml', sku: 'HIT-MOR-237', price: 1800, category: 'Jugos', image_url: 'https://placehold.co/400x400/800080/FFFFFF?text=Hit+Mora' },
    { name: 'Jugo Hit Tropical 237ml', sku: 'HIT-TRO-237', price: 1800, category: 'Jugos', image_url: 'https://placehold.co/400x400/FF4500/FFFFFF?text=Hit+Tropical' },
    { name: 'Jugo Hit Mora 500ml', sku: 'HIT-MOR-500', price: 3000, category: 'Jugos', image_url: 'https://placehold.co/400x400/800080/FFFFFF?text=Hit+Mora+500' },
    { name: 'Jugo Hit Mango 500ml', sku: 'HIT-MAN-500', price: 3000, category: 'Jugos', image_url: 'https://placehold.co/400x400/FFD700/000000?text=Hit+Mango+500' },
    { name: 'Agua Cristal 600ml', sku: 'AGU-CRI-600', price: 1500, category: 'Aguas', image_url: 'https://placehold.co/400x400/87CEEB/000000?text=Agua+Cristal' },
    { name: 'Agua Brisa 600ml', sku: 'AGU-BRI-600', price: 1500, category: 'Aguas', image_url: 'https://placehold.co/400x400/4169E1/FFFFFF?text=Agua+Brisa' },
    { name: 'Agua Oasis con Gas 600ml', sku: 'AGU-OAS-600', price: 1800, category: 'Aguas', image_url: 'https://placehold.co/400x400/4169E1/FFFFFF?text=Oasis+Gas' },

    // Energizantes
    { name: 'Vive 100 400ml', sku: 'ENE-VIV-400', price: 2000, category: 'Energizantes', image_url: 'https://placehold.co/400x400/32CD32/FFFFFF?text=Vive+100' },
    { name: 'Speed Max 400ml', sku: 'ENE-SPE-400', price: 2000, category: 'Energizantes', image_url: 'https://placehold.co/400x400/0000CD/FFFFFF?text=Speed+Max' },
    { name: 'Red Bull Clásico 250ml', sku: 'ENE-RED-250', price: 6500, category: 'Energizantes', image_url: 'https://placehold.co/400x400/00008B/FFFFFF?text=Red+Bull' },
    { name: 'Red Bull Clásico 355ml', sku: 'ENE-RED-355', price: 8500, category: 'Energizantes', image_url: 'https://placehold.co/400x400/00008B/FFFFFF?text=Red+Bull+355' },
    { name: 'Monster Energy 473ml', sku: 'ENE-MON-473', price: 7000, category: 'Energizantes', image_url: 'https://placehold.co/400x400/000000/00FF00?text=Monster' },

    // Tes (Hatsu, Mr. Tea)
    { name: 'Té Hatsu Blanco 400ml', sku: 'TEA-HAT-BLA-400', price: 4500, category: 'Tes', image_url: 'https://placehold.co/400x400/FFFFFF/000000?text=Hatsu+Blanco' },
    { name: 'Té Hatsu Negro 400ml', sku: 'TEA-HAT-NEG-400', price: 4500, category: 'Tes', image_url: 'https://placehold.co/400x400/000000/FFFFFF?text=Hatsu+Negro' },
    { name: 'Té Hatsu Rosado 400ml', sku: 'TEA-HAT-ROS-400', price: 4500, category: 'Tes', image_url: 'https://placehold.co/400x400/FFB6C1/000000?text=Hatsu+Rosado' },
    { name: 'Té Hatsu Azul 400ml', sku: 'TEA-HAT-AZU-400', price: 4500, category: 'Tes', image_url: 'https://placehold.co/400x400/ADD8E6/000000?text=Hatsu+Azul' },
    { name: 'Mr. Tea Limón 500ml', sku: 'TEA-MRT-LIM-500', price: 2500, category: 'Tes', image_url: 'https://placehold.co/400x400/FFFF00/000000?text=Mr.+Tea+Limon' },
    { name: 'Mr. Tea Durazno 500ml', sku: 'TEA-MRT-DUR-500', price: 2500, category: 'Tes', image_url: 'https://placehold.co/400x400/FFDAB9/000000?text=Mr.+Tea+Durazno' },

    // Confitería (Snacks)
    { name: 'Chocoramo 65g', sku: 'CON-CHO-065', price: 2200, category: 'Confiteria', image_url: 'https://placehold.co/400x400/FFA500/000000?text=Chocoramo' },
    { name: 'Chocolatina Jet 12g', sku: 'CON-JET-012', price: 800, category: 'Confiteria', image_url: 'https://placehold.co/400x400/0000CD/FFFFFF?text=Jet' },
    { name: 'Galletas Festival Fresa 40g', sku: 'CON-FES-040', price: 1200, category: 'Confiteria', image_url: 'https://placehold.co/400x400/FF69B4/FFFFFF?text=Festival' },
    { name: 'Papas Margarita Limón 39g', sku: 'CON-MAR-039', price: 2500, category: 'Confiteria', image_url: 'https://placehold.co/400x400/32CD32/FFFFFF?text=Margarita+Limon' },
    { name: 'Papas Margarita Pollo 39g', sku: 'CON-MAR-P039', price: 2500, category: 'Confiteria', image_url: 'https://placehold.co/400x400/FF8C00/FFFFFF?text=Margarita+Pollo' },
    { name: 'Papas Pringles Original 124g', sku: 'CON-PRI-124', price: 12000, category: 'Confiteria', image_url: 'https://placehold.co/400x400/FF0000/FFFFFF?text=Pringles' },
    { name: 'Gansito 35g', sku: 'CON-GAN-035', price: 1500, category: 'Confiteria', image_url: 'https://placehold.co/400x400/FFB6C1/000000?text=Gansito' },
    { name: 'De Todito Natural 45g', sku: 'CON-TOD-045', price: 3500, category: 'Confiteria', image_url: 'https://placehold.co/400x400/1E90FF/FFFFFF?text=De+Todito' },
    { name: 'Quipitos 8g', sku: 'CON-QUI-008', price: 500, category: 'Confiteria', image_url: 'https://placehold.co/400x400/FFFF00/000000?text=Quipitos' },
    { name: 'Piruleta Bon Bon Bum Fresa 17g', sku: 'CON-BBB-017', price: 600, category: 'Confiteria', image_url: 'https://placehold.co/400x400/DC143C/FFFFFF?text=Bon+Bon+Bum' }
];

async function seedStore() {
    console.log('Seeding Store Products...');

    for (const prod of products) {
        const stock = Math.floor(Math.random() * 21); // Random 0-20

        // Upsert to not duplicate if run multiple times
        await prisma.product.upsert({
            where: { sku: prod.sku },
            update: {
                price: prod.price,
                current_stock: stock,
                category: prod.category,
                image_url: prod.image_url
            },
            create: {
                name: prod.name,
                sku: prod.sku,
                price: prod.price,
                current_stock: stock,
                min_stock: 5,
                category: prod.category,
                image_url: prod.image_url
            }
        });
        console.log(`Upserted: ${prod.name} | Stock: ${stock}`);
    }

    console.log('Store seeded with Colombian products successfully!');
}

seedStore()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
