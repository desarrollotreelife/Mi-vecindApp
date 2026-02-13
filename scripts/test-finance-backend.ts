import axios from 'axios';

const API_URL = 'http://localhost:3001/api/finance';

async function testFinanceFlow() {
    console.log('🚀 Testing Finance Backend...');

    try {
        // 1. Get Initial Summary
        console.log('\nPlease check server logs for errors if this hangs.');
        const initialSummary = await axios.get(`${API_URL}/summary`);
        console.log('1. Initial Summary:', initialSummary.data);

        // 2. Create Expense
        console.log('\n2. Creating Expense...');
        const expense = await axios.post(`${API_URL}/expenses`, {
            amount: 50000,
            category: 'maintenance',
            description: 'Reparación de ascensor (Test)',
            complexId: 1
        });
        console.log('✅ Expense Created:', expense.data.id);

        // 3. Get Expenses List
        console.log('\n3. Fetching Expenses...');
        const expenses = await axios.get(`${API_URL}/expenses`);
        console.log(`✅ Found ${expenses.data.length} expenses.`);
        console.log('Last expense:', expenses.data[0]);

        // 4. Verify Summary Updated
        const newSummary = await axios.get(`${API_URL}/summary`);
        console.log('\n4. New Summary:', newSummary.data);

        const diffExpenses = newSummary.data.expenses.total - initialSummary.data.expenses.total;
        if (Math.abs(diffExpenses - 50000) < 0.01) {
            console.log('✅ SUCCESS: Expense total increased by 50,000');
        } else {
            console.log('❌ FAILURE: Expense total mismatch. Diff:', diffExpenses);
        }

    } catch (error: any) {
        console.error('❌ Error during test:', error.response?.data || error.message);
    }
}

testFinanceFlow();
