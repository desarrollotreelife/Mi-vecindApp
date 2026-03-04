import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPasses() {
    try {
        const badHash = "$2b$10$EpRnTzVlqHNP0.fKb.U/..t.Chq.GT/Oe";
        const goodHash = "$2b$10$iD8IJb/c.djo7wCteiojEO0r1kINOC1SaFfN4nbMc8XRv2lgdwf.u"; // 123456

        const result = await prisma.user.updateMany({
            where: {
                password_hash: badHash
            },
            data: {
                password_hash: goodHash
            }
        });

        console.log(`Updated ${result.count} users with correct default password.`);

        // Also let's fix the user roles for the ones created recently if any are wrong.
        // The user "Pablo" was created as role 3. If he should have been something else,
        // the UI would allow editing him. For now we just fix the login.

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

fixPasses();
