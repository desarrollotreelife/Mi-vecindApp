import axios from 'axios';

async function testApi() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'superadmin1',
            password: '123456'
        });

        const token = loginRes.data.token;
        console.log('Login success. Token obtained.');

        console.log('Fetching complexes...');
        const complexesRes = await axios.get('http://localhost:3001/api/super-admin/complexes', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('--- Complexes from API ---');
        console.log(JSON.stringify(complexesRes.data, null, 2));
    } catch (error: any) {
        console.error('API Test Failed:', error.response?.data || error.message);
    }
}

testApi();
