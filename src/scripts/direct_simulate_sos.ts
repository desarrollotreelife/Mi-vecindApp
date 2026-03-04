import { EmergencyService } from '../modules/emergency/emergency.service';
import { prisma } from '../core/prisma';
import { initSocket } from '../core/socket.service';
import http from 'http';

async function directSimulateSOS(unitNumber: string) {
    console.log(`--- Direct SOS Simulation for Unit ${unitNumber} ---`);

    // We need to initialize socket service for the service to work
    const server = http.createServer();
    initSocket(server);

    const service = new EmergencyService();

    try {
        // Find a resident user
        const resident = await prisma.resident.findFirst({
            where: { unit: { number: unitNumber } },
            include: { user: true, unit: true }
        });

        if (!resident) {
            console.error(`❌ Resident for unit ${unitNumber} not found.`);
            return;
        }

        const alert = await service.triggerAlert({
            userId: resident.user_id,
            complexId: resident.user.complex_id!,
            type: 'panic',
            latitude: 4.6097,
            longitude: -74.0817,
            accuracy: 5
        });

        console.log('✅ SOS Alert Triggered directly:', alert.id);
        console.log('Check the 3D Visualizer now!');

        // Wait a bit to ensure the socket emit finishes
        setTimeout(() => process.exit(0), 1000);

    } catch (error: any) {
        console.error('❌ Error triggering SOS:', error.message);
        process.exit(1);
    }
}

const unit = process.argv[2] || '101';
directSimulateSOS(unit);
