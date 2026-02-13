import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Creating demo voting session...');

    // Create a session in 'open' status
    const session = await prisma.votingSession.create({
        data: {
            title: 'Asamblea General Extraordinaria 2026',
            description: 'Votación para aprobar presupuesto de mejoras en zonas comunes.',
            start_date: new Date(),
            type: 'assembly',
            status: 'open',
            topics: {
                create: [
                    {
                        question: '¿Aprueba la construcción de la piscina climatizada?',
                        options: JSON.stringify(['A favor', 'En contra', 'Abstención'])
                    },
                    {
                        question: '¿Aprueba el cambio de empresa de vigilancia?',
                        options: JSON.stringify(['Sí', 'No', 'Abstención'])
                    }
                ]
            }
        }
    });

    console.log('Demo Session Created:', session.id);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
