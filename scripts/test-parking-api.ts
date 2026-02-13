
import request from 'supertest';
import app from './src/app';

async function testApi() {
    console.log('1. Logging in...');
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin', password: '123456' }); // Password reset earlier

    if (loginRes.status !== 200) {
        console.error('❌ Login failed:', loginRes.body);
        return;
    }

    const token = loginRes.body.token;
    console.log('✅ Login successful. Token obtained.');

    console.log('2. Fetching Parking Status...');
    const statusRes = await request(app)
        .get('/api/parking/status')
        .set('Authorization', `Bearer ${token}`);

    if (statusRes.status !== 200) {
        console.error(`❌ Fetch failed (Status ${statusRes.status}):`, statusRes.body);
    } else {
        console.log('✅ Fetch successful!');
        console.log('   Create Summary:', statusRes.body.summary);
        console.log('   Slots CountFromAPI:', statusRes.body.slots.length);
        console.log('   Sample Slot:', statusRes.body.slots[0]);
    }
}

testApi();
