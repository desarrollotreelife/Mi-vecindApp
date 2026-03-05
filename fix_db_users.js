const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});

async function main() {
    try {
        // 1. Fix "Conjunto Residencial el Cortijo" (user id 3)
        // The user's screen showed NIT 22558877, email: elkindanielcastillo@gmail.com
        // Let's change their document_num to their NIT or a default so they can login. Or better, we set it to '88243048' (based on their screenshot where they tried to edit it)
        await prisma.user.update({
            where: { id: 3 },
            data: {
                role_id: 1, // Fix role to Admin
                document_num: '88243048' // Set the document number they wanted
            }
        });
        console.log("Fixed user 3 (el Cortijo) -> Role Admin, Doc: 88243048");

        // 2. Delete the Test Complex API we just created so we don't leave trash
        await prisma.user.deleteMany({ where: { complex_id: 3 } });
        await prisma.residentialComplex.delete({ where: { id: 3 } });
        console.log("Deleted test complex 3");

    } catch (err) {
        console.error("Error connecting to DB:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
