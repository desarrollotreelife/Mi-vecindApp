
import dotenv from 'dotenv';
import { prisma } from './src/core/prisma';
import { ResidentsService } from './src/modules/residents/residents.service';

dotenv.config();

const service = new ResidentsService();

async function runDebug() {
    console.log('🐞 Starting Debug Script...');

    try {
        // 1. Find a resident
        const resident = await prisma.resident.findFirst({
            include: { user: true }
        });

        if (!resident) {
            console.log('⚠️ No resident found to update.');
            return;
        }

        console.log(`👤 Found resident: ${resident.user.full_name} (ID: ${resident.id})`);
        console.log(`Original Photo: ${resident.user.profile_photo}`);

        // 2. Mock Update Data with Base64 Image
        // 1x1 red pixel
        const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwM+AAAAABJRU5ErkJggg==";

        const updateData = {
            id: resident.id,
            full_name: resident.user.full_name,
            email: resident.user.email,
            phone: resident.user.phone,
            document_num: resident.user.document_num,
            unit_id: resident.unit_id,
            photo: base64Image,
            user_type: 'resident'
        };

        // 3. Call Service
        console.log('🔄 Calling updateResident...');
        const updated = await service.updateResident(resident.id, updateData);

        console.log('✅ Update completed.');
        console.log(`New Photo URL: ${updated.user.profile_photo}`);

        if (updated.user.profile_photo && updated.user.profile_photo !== resident.user.profile_photo) {
            console.log('🎉 SUCCESS: Photo URL changed.');
        } else {
            console.log('❌ FAILURE: Photo URL did not change.');
        }

    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runDebug();
