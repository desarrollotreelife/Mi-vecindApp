// Test script to verify database connection and file storage
import { prisma } from './src/core/prisma';
import { fileStorage } from './src/utils/fileStorage';

async function testSystem() {
    console.log('🔍 Testing System...\n');

    // Test 1: Database Connection
    try {
        console.log('1️⃣ Testing database connection...');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('✅ Database connected! Found', users.length, 'user(s)');
    } catch (error) {
        console.error('❌ Database error:', error);
    }

    // Test 2: File Storage
    try {
        console.log('\n2️⃣ Testing file storage...');
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const photoUrl = fileStorage.savePhoto(testImage, 'test');
        console.log('✅ Photo saved successfully!');
        console.log('   URL:', photoUrl);
        console.log('   Backup folder:', fileStorage.getBackupPath());
    } catch (error) {
        console.error('❌ File storage error:', error);
    }

    // Test 3: List Residents
    try {
        console.log('\n3️⃣ Listing residents...');
        const residents = await prisma.resident.findMany({
            include: { user: true, unit: true }
        });
        console.log(`✅ Found ${residents.length} resident(s)`);
        residents.forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.user.full_name} - Unit: ${r.unit?.number || 'N/A'}`);
        });
    } catch (error) {
        console.error('❌ Error listing residents:', error);
    }

    await prisma.$disconnect();
    console.log('\n✅ Test completed!');
}

testSystem();
