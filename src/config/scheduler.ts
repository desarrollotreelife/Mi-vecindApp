import cron from 'node-cron';
import { backupService } from '../services/backup.service';

/**
 * Schedule automatic daily backups
 * Runs every day at 2:00 AM
 */
export function initializeBackupScheduler() {
    // Daily backup at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('\n⏰ Ejecutando backup automático diario...');
        try {
            await backupService.createDailyBackup();
            const stats = backupService.getBackupStats();
            console.log(`📊 Estadísticas de backup:`);
            console.log(`   Total de backups: ${stats.total}`);
            console.log(`   Día más antiguo: ${stats.oldestDay}`);
            console.log(`   Día más reciente: ${stats.newestDay}`);
            console.log(`   Tamaño total: ${stats.totalSize}\n`);
        } catch (error) {
            console.error('❌ Error en backup automático:', error);
        }
    });

    console.log('✅ Programador de backups inicializado');
    console.log('   📅 Backup diario: 2:00 AM');
    console.log('   🔄 Rotación: 31 días');
    console.log('   💾 Ubicación:', backupService['backupDir']);

    // Create initial backup on startup
    setTimeout(async () => {
        console.log('\n💾 Creando backup inicial...');
        try {
            await backupService.createDailyBackup();
            console.log('✅ Backup inicial completado\n');
        } catch (error) {
            console.error('❌ Error en backup inicial:', error);
        }
    }, 5000); // Wait 5 seconds after server start
}
