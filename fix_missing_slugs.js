const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.poijpndmrahszjvpztbn:v9qR%5DGIiutD@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
        }
    }
});

async function main() {
    console.log('Fetching complexes with missing slugs...');
    const complexes = await prisma.residentialComplex.findMany({
        where: { url_slug: null }
    });

    console.log(`Found ${complexes.length} complexes without a slug. Fixing...`);

    for (const complex of complexes) {
        const baseSlug = complex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        let finalSlug = baseSlug;
        let counter = 1;

        while (await prisma.residentialComplex.findUnique({ where: { url_slug: finalSlug } })) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        await prisma.residentialComplex.update({
            where: { id: complex.id },
            data: { url_slug: finalSlug }
        });

        console.log(`Updated "${complex.name}" -> ${finalSlug}`);
    }

    console.log('All missing slugs generated!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
