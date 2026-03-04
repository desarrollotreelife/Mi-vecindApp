import axios from 'axios';

async function simulateSOS(unitNumber: string) {
    console.log(`--- Simulating SOS Alert for Unit ${unitNumber} ---`);
    try {
        // We need a valid resident token or trigger via direct service if we had access to prisma here
        // But let's use the API to be realistic. We need to login as a resident first.

        // 1. Login as resident (assuming test account exists from setup)
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'diego@gmail.com', // Test resident
            password: 'password123'
        });
        const token = loginRes.data.token;

        // 2. Trigger SOS
        const sosRes = await axios.post('http://localhost:3001/api/emergency/trigger', {
            type: 'panic',
            latitude: 4.6097,
            longitude: -74.0817,
            accuracy: 10
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ SOS Alert Triggered successfully:', sosRes.data.id);
        console.log('Check the 3D Visualizer now!');

    } catch (error: any) {
        console.error('❌ Error simulating SOS:', error.response?.data || error.message);
    }
}

const unitToAlert = process.argv[2] || '101';
simulateSOS(unitToAlert);
