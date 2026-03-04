import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

async function testCatalog() {
    try {
        console.log("Fetching /api/store/catalog...");
        const response = await axios.get('http://localhost:3000/api/store/catalog');
        console.log(`Status: ${response.status}`);
        console.log(`Items found: ${response.data.length}`);
        if (response.data.length > 0) {
            console.log("First item:", response.data[0]);
        }
    } catch (e: any) {
        console.error("Error:", e.response?.data || e.message);
    }
}

testCatalog();
