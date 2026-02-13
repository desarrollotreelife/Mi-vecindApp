import axios from 'axios';

const API_URL = 'http://localhost:3001/api/amenities';

// Helper to create delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testAmenitiesFlow() {
    console.log('🚀 Testing Amenities Booking Flow...');

    try {
        // 1. Create a dummy amenity if none (assuming ID 1 exists for simplicity or create one)
        // For this test, we assume Amenity ID 1 exists (e.g. BBQ)
        const amenityId = 1;
        const userId = 4; // Use our restored user Gloria
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 1); // Tomorrow
        startTime.setHours(10, 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(14, 0, 0, 0);

        // 2. Create Booking (Resident)
        console.log('\n1. Creating Booking...');
        const bookingRes = await axios.post(`${API_URL}/book`, {
            amenity_id: amenityId,
            user_id: userId,
            start_time: startTime,
            end_time: endTime,
            guest_count: 5
        });
        const bookingId = bookingRes.data.id;
        console.log('✅ Booking Created:', bookingId, 'Status:', bookingRes.data.status);

        if (bookingRes.data.status !== 'pending') {
            console.error('❌ Status should be pending!');
        }

        // 3. List Bookings (Admin)
        console.log('\n2. Listing Pending Bookings...');
        const listRes = await axios.get(`${API_URL}/bookings?status=pending`);
        const found = listRes.data.find((b: any) => b.id === bookingId);
        if (found) {
            console.log('✅ Found pending booking in list.');
        } else {
            console.error('❌ Booking not found in pending list.');
        }

        // 4. Approve Booking (Admin)
        console.log('\n3. Approving Booking...');
        const approveRes = await axios.post(`${API_URL}/bookings/${bookingId}/approve`);
        console.log('✅ Approval Response:', approveRes.data.status);

        if (approveRes.data.status === 'approved') {
            console.log('✅ SUCCESS: Booking approved correctly.');
        } else {
            console.error('❌ Failed to approve.');
        }

        // 5. Try to book same slot (Conflict Check)
        console.log('\n4. Testing Conflict...');
        try {
            await axios.post(`${API_URL}/book`, {
                amenity_id: amenityId,
                user_id: userId,
                start_time: startTime,
                end_time: endTime,
                guest_count: 2
            });
            console.error('❌ Should have failed with conflict error (approved booking exists).');
        } catch (error: any) {
            console.log('✅ Conflict Detected Correctly:', error.response?.data?.error);
        }

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
    }
}

testAmenitiesFlow();
