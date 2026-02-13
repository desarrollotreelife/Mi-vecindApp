import { AuthService } from './src/modules/auth/auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLogin() {
    console.log('--- TEST LOGIN START ---');
    const authService = new AuthService();

    // Test hardcoded credentials
    const credentials = {
        email: 'admin',
        password: '123456'
    };

    console.log('Testing credentials:', credentials);

    try {
        const result = await authService.login(credentials);
        console.log('LOGIN SUCCESS!');
        console.log('Token:', result.token ? 'Generated' : 'Missing');
        console.log('User ID:', result.user.id);
        console.log('User Role:', result.user.role_id);
    } catch (error: any) {
        console.error('LOGIN FAILED');
        console.error('Error:', error.message);

        // Debug user directly
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (user) {
            console.log('User exists in DB. Hash:', user.password_hash);
        } else {
            console.log('User DOES NOT exist in DB');
        }
    } finally {
        await prisma.$disconnect();
    }
    console.log('--- TEST LOGIN END ---');
}

testLogin();
