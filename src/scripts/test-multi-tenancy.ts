
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Multi-Tenancy Test ---');

    // 1. Clean up (optional, or just create unique names)
    const suffix = Math.floor(Math.random() * 10000);

    // 2. Create Two Complexes
    console.log('Creating complexes...');
    const complexA = await prisma.residentialComplex.create({
        data: {
            name: `Test Complex A ${suffix}`,
            address: 'Address A',
            phone: '123'
        }
    });

    const complexB = await prisma.residentialComplex.create({
        data: {
            name: `Test Complex B ${suffix}`,
            address: 'Address B',
            phone: '456'
        }
    });

    console.log(`Created Complex A: ${complexA.id}`);
    console.log(`Created Complex B: ${complexB.id}`);

    // 3. Create Users/Admins for each
    const passwordHash = await bcrypt.hash('123456', 10);

    // Role assumptions: 1 = Admin (or finding actual role)
    const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
    if (!adminRole) throw new Error('Admin role not found');

    const userA = await prisma.user.create({
        data: {
            email: `adminA_${suffix}@test.com`,
            document_num: `adminA_${suffix}`,
            password_hash: passwordHash,
            full_name: 'Admin Complex A',
            role_id: adminRole.id,
            complex_id: complexA.id
        }
    });

    const userB = await prisma.user.create({
        data: {
            email: `adminB_${suffix}@test.com`,
            document_num: `adminB_${suffix}`,
            password_hash: passwordHash,
            full_name: 'Admin Complex B',
            role_id: adminRole.id,
            complex_id: complexB.id
        }
    });

    console.log(`Created User A: ${userA.email} (Complex ${complexA.id})`);
    console.log(`Created User B: ${userB.email} (Complex ${complexB.id})`);

    // 4. Create Data for Complex A (Unit + Resident)
    const unitA = await prisma.unit.create({
        data: {
            complex_id: complexA.id,
            block: 'A',
            number: '101',
            floor: 1,
            type: 'apartment',
            coefficient: 1.0
        }
    });

    const residentA = await prisma.resident.create({
        data: {
            unit_id: unitA.id,
            user_id: userA.id, // Linking admin as resident for simplicity or creating new
            type: 'owner'
        }
    });

    // 5. Create Data for Complex B
    const unitB = await prisma.unit.create({
        data: {
            complex_id: complexB.id,
            block: 'B',
            number: '101',
            floor: 1,
            type: 'apartment',
            coefficient: 1.0
        }
    });

    // 6. Verification Logic (Simulated Service Calls)
    // We will verify using Prisma queries directly to emulate what the "Service" does with a where clause
    // Ideally we would call the Service classes directly if we can import them, but this script runs standalone.
    // Let's import the specific services to test properly.

    console.log('\n--- Testing Service Isolation ---');

    // Import Services (Dynamically or assumed available if compiled)
    // For this script to run with ts-node, we can import relative to src
    const { ResidentsService } = require('../modules/residents/residents.service');
    const { UnitsService } = require('../modules/units/units.service');

    const residentsService = new ResidentsService();
    const unitsService = new UnitsService();

    // Test A: User A fetches residents
    console.log(`\nUser A (Complex ${userA.complex_id}) fetching residents...`);
    const residentsForA = await residentsService.listResidents(userA.complex_id!);
    console.log(`Count: ${residentsForA.length}`);
    if (residentsForA.length === 1 && residentsForA[0].id === residentA.id) {
        console.log('✅ PASS: User A sees only Resident A');
    } else {
        console.error('❌ FAIL: User A saw unexpected data', residentsForA);
    }

    // Test B: User B fetches residents
    console.log(`\nUser B (Complex ${userB.complex_id}) fetching residents...`);
    const residentsForB = await residentsService.listResidents(userB.complex_id!);
    console.log(`Count: ${residentsForB.length}`);
    if (residentsForB.length === 0) {
        // User B has no residents created yet (we only created Unit B, no resident linking User B strictly as resident of Unit B in step 5?) 
        // Wait, in step 5 we created Unit B but NO resident.
        console.log('✅ PASS: User B sees 0 residents (correct)');
    } else {
        console.error('❌ FAIL: User B saw unexpected data', residentsForB);
    }

    // Test C: User A fetches Units
    console.log(`\nUser A (Complex ${userA.complex_id}) fetching structure...`);
    const structureA = await unitsService.getStructure(userA.complex_id!);
    // structure is object { Block: [units] }
    const blockAUnits = structureA['A'];
    if (blockAUnits && blockAUnits.length === 1 && blockAUnits[0].complex_id === complexA.id) {
        console.log('✅ PASS: User A sees Unit A');
    } else {
        console.error('❌ FAIL: User A structure mismatch', structureA);
    }

    if (structureA['B']) {
        console.error('❌ FAIL: User A saw Block B from Complex B!');
    } else {
        console.log('✅ PASS: User A does NOT see Block B');
    }

    console.log('\n--- Multi-Tenancy Test Completed ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
