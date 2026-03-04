import axios from 'axios';

async function simulateWebhook(billId: number, amount: number) {
    console.log(`--- Simulating ePayco Webhook for Bill #${billId} ---`);

    const payload = {
        x_id_invoice: `SIM-${billId}-${Date.now()}`,
        x_cod_response: '1', // 1 = Accepted
        x_ref_payco: `REF-${Math.floor(Math.random() * 1000000)}`,
        x_amount: amount.toString(),
        x_currency: 'COP',
        x_franchise: 'VISA',
        x_extra1: `bill_${billId}`
    };

    try {
        const response = await axios.post('http://localhost:3001/api/payments/confirm', payload);
        console.log('Response from server:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('✅ WEBHOOK SIMULATED SUCCESSFULLY');
        } else {
            console.log('❌ WEBHOOK SIMULATION FAILED');
        }
    } catch (error: any) {
        console.error('❌ ERROR SENDING WEBHOOK:', error.response?.data || error.message);
    }
}

// Get billId from command line args
const args = process.argv.slice(2);
const billIdArg = args[0];
const amountArg = args[1] || '250000';

if (!billIdArg) {
    console.log('Usage: npx ts-node src/scripts/simulate_epayco_webhook.ts <billId> [amount]');
} else {
    simulateWebhook(Number(billIdArg), Number(amountArg));
}
