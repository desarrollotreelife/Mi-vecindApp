
import request from 'supertest';
import app from './src/app';

async function testFinanceFlow() {
    console.log('--- Starting Finance Flow Test ---');

    // 1. Login
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin', password: '123456' });
    const token = loginRes.body.token;
    if (!token) { console.error('Login Failed'); return; }
    console.log('✅ Login Successful');

    // 2. Create Block
    console.log('Creating Block B...');
    const blockRes = await request(app)
        .post('/api/units/block')
        .set('Authorization', `Bearer ${token}`)
        .send({ blockName: 'Torre B', floors: 2, unitsPerFloor: 2, startNumber: 1 });

    if (blockRes.status !== 200) console.log('⚠️ createBlock status:', blockRes.status, blockRes.body);
    else console.log('✅ Block B Created/Existed');

    // 3. Get Structure to find a unit ID
    const structRes = await request(app).get('/api/units/structure').set('Authorization', `Bearer ${token}`);
    const unit = structRes.body['Torre B']?.[0];
    if (!unit) { console.error('❌ No unit found in Torre B'); return; }
    console.log(`✅ Should use Unit ID: ${unit.id} (${unit.number})`);

    // 4. Create Bill
    console.log('Creating Bill...');
    const billRes = await request(app)
        .post('/api/finance/bills')
        .set('Authorization', `Bearer ${token}`)
        .send({
            unitId: unit.id,
            amount: 50000,
            description: 'Test Admin Fee',
            type: 'admin_fee',
            dueDate: new Date().toISOString()
        });

    if (billRes.status !== 200) { console.error('❌ Create Bill Failed', billRes.body); return; }
    console.log('✅ Bill Created:', billRes.body.id);
    const billId = billRes.body.id;

    // 5. Pay Bill
    console.log('Paying Bill...');
    const payRes = await request(app)
        .post('/api/finance/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({
            billId: billId,
            amount: 50000,
            method: 'cash',
            reference: 'TEST-REF'
        });

    if (payRes.status !== 200) { console.error('❌ Payment Failed', payRes.body); return; }
    console.log('✅ Payment Registered');

    // 6. Check Statement
    const stmtRes = await request(app)
        .get(`/api/finance/statement/${unit.id}`)
        .set('Authorization', `Bearer ${token}`);

    const billInStmt = stmtRes.body.bills.find((b: any) => b.id === billId);
    if (billInStmt && billInStmt.status === 'paid') {
        console.log('✅ Verification Passed: Bill is PAID in statement.');
    } else {
        console.error('❌ Verification Failed: Bill status is', billInStmt?.status);
    }
}

testFinanceFlow();
