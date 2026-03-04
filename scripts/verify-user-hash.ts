
import bcrypt from 'bcryptjs';

const hash = '$2a$10$jq/2sy7GAPAod6Bfp9aD8O4KdioqqLWNlN2iIFS1Wbwbw6Q9ulvx.';
const passwords = ['123456', 'admin', 'password', 'jamescastillo0130'];

async function check() {
    console.log('Analizando hash:', hash);
    for (const p of passwords) {
        const match = await bcrypt.compare(p, hash);
        if (match) {
            console.log(`✅ ¡El hash corresponde a la contraseña: "${p}"!`);
            return;
        }
    }
    console.log('❌ El hash no coincide con contraseñas comunes.');
}

check();
