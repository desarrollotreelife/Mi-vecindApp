import cron from 'node-cron';
import { backupService } from '../services/backup.service';
import { FinanceService } from '../modules/finance/finance.service';
import { SubscriptionCron } from '../modules/store/subscription.cron';

const financeService = new FinanceService();

/**
 * Schedule automatic daily backups and billing
 */
export function initializeScheduler() {
    // Daily backup at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        // ... (existing backup code)
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

    // Daily billing check at 1:00 AM
    cron.schedule('0 1 * * *', async () => {
        console.log('\n⏰ Verificando facturación mensual automática...');
        try {
            await financeService.checkAndGenerateAllBills();
        } catch (error) {
            console.error('❌ Error en facturación automática:', error);
        }
    });

    // Daily Subscription Processing at 6:00 AM
    cron.schedule('0 6 * * *', async () => {
        await SubscriptionCron.processDailySubscriptions();
    });

    console.log('✅ Programador de tareas inicializado');
    console.log('   📅 Backup diario: 2:00 AM');
    console.log('   💰 Facturación: 1:00 AM');
    console.log('   🛒 Suscripciones tienda: 6:00 AM');
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
