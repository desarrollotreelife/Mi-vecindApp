import { prisma } from '../core/prisma';
import { fileStorage } from '../utils/fileStorage';
import { subMonths } from 'date-fns';

export class StorageCleanupService {
    /**
     * Main task to purge old data (Retention policy: 6 months)
     */
    static async runSemiAnnualCleanup() {
        console.log('🧹 [CRON] Iniciando Limpieza Semestral de Almacenamiento...');

        const sixMonthsAgo = subMonths(new Date(), 6);

        // 1. Process Visitors (Delete photos of visitors not seen in 6 months)
        const expiredVisitors = await prisma.visitor.findMany({
            where: {
                last_verified_at: { lt: sixMonthsAgo },
                photo_url: { not: null }
            }
        });

        console.log(`🔍 Se encontraron ${expiredVisitors.length} visitantes con datos expirados.`);

        for (const visitor of expiredVisitors) {
            if (visitor.photo_url) {
                fileStorage.deletePhoto(visitor.photo_url);
                await prisma.visitor.update({
                    where: { id: visitor.id },
                    data: { photo_url: null } // Remove reference to save space
                });
            }
        }

        // 2. Process Residents/Users (Flags them but doesn't delete without notification)
        const expiredUsers = await prisma.user.findMany({
            where: {
                last_verified_at: { lt: sixMonthsAgo },
                status: 'active'
            }
        });

        console.log(`⚠️ Se encontraron ${expiredUsers.length} residentes que requieren actualización de datos.`);

        // Note: For residents, we might just flag them or send a notification 
        // instead of immediate deletion to avoid breaking their access.

        console.log('✅ Limpieza de almacenamiento completada.');
    }
}
