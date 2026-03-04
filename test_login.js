const axios = require('axios');

async function test() {
    try {
        const response = await axios.post('https://mi-vecindapp.onrender.com/api/auth/login', {
            document_num: 'admin',
            password: 'wrong_on_purpose'
        });
        console.log('SUCCESS:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('API ERROR:', error.response.status, error.response.data);
        } else {
            console.log('NETWORK ERROR:', error.message);
        }
    }
}
test();
