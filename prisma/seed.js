const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 0. Residential Complex
    const complex = await prisma.residentialComplex.upsert({
        where: { nit: '900123456-1' },
        update: {},
        create: {
            name: 'Conjunto Residencial Demo',
            nit: '900123456-1',
            address: 'Calle 123 # 45-67',
            city: 'Bogotá',
            phone: '3001234567'
        }
    });
    const complexId = complex.id;
    console.log(`✅ Complex created: ${complex.name} (ID: ${complexId})`);

    // 1. Roles
    const roles = ['admin', 'resident', 'guard', 'staff', 'propietario', 'residente_propietario'];
    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role },
            update: {},
            create: { name: role, permissions: '[]' },
        });
    }
    console.log('✅ Roles created/verified.');

    // 2. Units
    const units = [
        { block: 'A', number: '101' },
        { block: 'A', number: '102' },
        { block: 'B', number: '201' },
        { block: 'T5', number: '501' },
    ];

    for (const u of units) {
        await prisma.unit.upsert({
            where: {
                complex_id_block_number: {
                    complex_id: complexId,
                    block: u.block,
                    number: u.number
                }
            },
            update: { complex_id: complexId },
            create: {
                type: 'apartment',
                block: u.block,
                number: u.number,
                complex_id: complexId
            }
        });
    }
    console.log('✅ Units created/verified.');

    // 3. Admin User
    await prisma.user.upsert({
        where: { email: 'admin@simids.com' },
        update: { complex_id: complexId },
        create: {
            email: 'admin@simids.com',
            password_hash: '$2b$10$EpRnTzVlqHNP0.fKb.U/..t.Chq.GT/Oe', // "password"
            full_name: 'Administrador Principal',
            role_id: 1,
            complex_id: complexId
        },
    });
    console.log('✅ Admin user created/verified.');

    // 4. Amenities
    const amenities = [
        { name: 'Salón Social', description: 'Espacio para eventos y reuniones.', status: 'available', capacity: 50 },
        { name: 'BBQ Zona Norte', description: 'Zona de asados al aire libre.', status: 'available', capacity: 15 },
        { name: 'Piscina', description: 'Piscina climatizada (Martes a Domingo).', status: 'maintenance', capacity: 30 },
    ];

    for (const a of amenities) {
        const existing = await prisma.amenity.findFirst({ where: { name: a.name } });
        if (!existing) {
            await prisma.amenity.create({
                data: { ...a, complex_id: complexId }
            });
        }
    }
    console.log('✅ Amenities created/verified.');

    // 5. Parking Slots (Multi-level)
    const slots = [
        { code: 'S1-01', floor: -1, type: 'visitor' }, // Basement Visitor
        { code: 'S1-02', floor: -1, type: 'resident' }, // Basement Resident
        { code: 'A-01', floor: 1, type: 'visitor' },
        { code: 'A-02', floor: 2, type: 'resident' }
    ];
    for (const s of slots) {
        await prisma.parkingSlot.upsert({
            where: {
                complex_id_code: {
                    complex_id: complexId,
                    code: s.code
                }
            },
            update: { floor: s.floor },
            create: {
                code: s.code,
                type: s.type,
                floor: s.floor,
                complex_id: complexId
            }
        });
    }
    console.log('✅ Parking slots created/verified.');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
