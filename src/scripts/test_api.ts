import axios from 'axios';

async function testFetch() {
    try {
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            document_num: 'admin',
            password: 'admin'
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token:', token.substring(0, 20) + '...');

        const productsRes = await axios.get('http://localhost:3001/api/store/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Fetched ${productsRes.data.length} products`);
        if (productsRes.data.length > 0) {
            console.log('Sample:', productsRes.data[0]);
        }
    } catch (err: any) {
        console.error('Error:', err.response?.data || err.message);
    }
}

testFetch();
