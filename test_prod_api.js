const axios = require('axios');

async function testProduccion() {
    try {
        console.log("1. Logging in as Super Admin...");
        const loginRes = await axios.post('https://mi-vecindapp.onrender.com/api/auth/login', {
            document_num: 'superadmin',
            password: '123456'
        });
        const token = loginRes.data.token;
        console.log("Login successful! Token:", token.substring(0, 20) + '...');

        console.log("2. Attempting to create a new complex...");
        const createRes = await axios.post('https://mi-vecindapp.onrender.com/api/super-admin/complexes', {
            name: 'Test Complex API',
            nit: 'API-12345',
            address: 'Calle Falsa 123',
            city: 'Bogota',
            admin_document_num: '9988776655',
            admin_email: 'test_api_admin@vecindapp.com',
            admin_password: 'password123',
            plan_type: 'standard',
            deletion_passcode: '0000'
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Creation successful!");
        console.log(createRes.data);

    } catch (error) {
        console.error("Error occurred:");
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testProduccion();
