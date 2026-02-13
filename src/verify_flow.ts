import request from 'supertest';
import app from './app';
import { prisma } from './core/prisma';

async function main() {
    console.log('--- Starting Verification Script ---');

    // Clean DB
    try {
        await prisma.accessLog.deleteMany();
        await prisma.vehicle.deleteMany();
        await prisma.visit.deleteMany();
        await prisma.booking.deleteMany();
        await prisma.amenity.deleteMany();
        await prisma.parkingUsage.deleteMany();
        await prisma.parkingSlot.deleteMany();
        await prisma.resident.deleteMany();
        await prisma.session.deleteMany();
        await prisma.user.deleteMany();
        await prisma.role.deleteMany();
    } catch (e) { console.log('DB Clean warning', e); }

    // 1. Setup Roles
    await prisma.role.createMany({
        data: [
            { id: 1, name: 'admin' },
            { id: 2, name: 'guard' },
            { id: 3, name: 'resident' },
        ]
    });
    console.log('✅ Roles seeded');

    // 2. Register Admin
    const adminRes = await request(app).post('/api/auth/register').send({
        email: 'admin@test.com',
        password: 'password123',
        full_name: 'Admin User',
        role_id: 1,
        phone: '1234567890'
    });

    if (adminRes.status !== 201) return console.error('❌ Admin registration failed', adminRes.body);
    const token = adminRes.body.token;
    console.log('✅ Admin registered');

    // 3. Create Unit
    const unit = await prisma.unit.create({
        data: { type: 'apartment', block: 'A', number: '101', floor: 1 }
    });

    // 4. Create Resident
    const residentRes = await request(app).post('/api/residents')
        .set('Authorization', `Bearer ${token}`)
        .send({
            email: 'resident@test.com',
            password: 'respass',
            full_name: 'John Doe',
            phone: '0987654321',
            unit_id: unit.id,
            type: 'owner'
        });

    if (residentRes.status !== 201) return console.error('❌ Resident creation failed', residentRes.body);
    const residentUser = residentRes.body.user_id;

    const createdResident = await prisma.resident.findFirst({ where: { unit_id: unit.id } });
    if (!createdResident) return console.error('❌ Resident not found in DB');

    // 5. Access
    await prisma.accessPoint.create({ data: { name: 'Main Gate', type: 'vehicle' } }); // Seed AP

    const accessRes = await request(app).post('/api/access/record')
        .set('Authorization', `Bearer ${token}`)
        .send({
            access_point_id: 1,
            method: 'face',
            user_id: residentUser
        });
    if (accessRes.status === 200) console.log('✅ Access recorded');
    else console.error('❌ Access failed', accessRes.body);

    // 6. Visits
    const visitRes = await request(app).post('/api/visits')
        .set('Authorization', `Bearer ${token}`)
        .send({
            resident_id: createdResident.id,
            visitor_name: 'Visitor One',
            visitor_doc: 'DOC12345',
            visitor_photo: 'https://placehold.co/400',
            vehicle_plate: 'VIS-999',
            scheduled_entry: new Date().toISOString()
        });
    if (visitRes.status === 201) console.log('✅ Visit scheduled');
    else console.error('❌ Visit failed', visitRes.body);

    // 7. Amenities
    const amenityRes = await request(app).post('/api/amenities')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pool', capacity: 20, price_per_hour: 0 });

    if (amenityRes.status === 201) {
        console.log('✅ Amenity created');
        const bookingRes = await request(app).post('/api/amenities/book')
            .set('Authorization', `Bearer ${token}`)
            .send({
                amenity_id: amenityRes.body.id,
                user_id: residentUser,
                start_time: new Date(Date.now() + 3600000).toISOString(),
                end_time: new Date(Date.now() + 7200000).toISOString(),
                guest_count: 2
            });
        if (bookingRes.status === 201) console.log('✅ Booking created');
        else console.error('❌ Booking failed', bookingRes.body);
    }

    // 8. Parking
    const vehicleRes = await request(app).post('/api/parking/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ plate: 'RES-001', brand: 'Ford', color: 'Blue', resident_id: createdResident.id });

    if (vehicleRes.status === 201) console.log('✅ Vehicle registered');
    else console.error('❌ Vehicle registration failed', vehicleRes.body);

    console.log('--- Verification Finished ---');
}

main().catch(console.error);
