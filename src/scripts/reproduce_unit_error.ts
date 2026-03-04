import axios from 'axios';

async function reproduceError() {
    const token = 'YOUR_TOKEN_HERE'; // I need to get a token
    try {
        const response = await axios.post('http://localhost:3001/api/units/block', {
            blockName: 'TORRE 1',
            floors: 5,
            unitsPerFloor: 2,
            startNumber: 1
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Success:', response.data);
    } catch (error: any) {
        console.log('Error Status:', error.response?.status);
        console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}
// reproduceError();
