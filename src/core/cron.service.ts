import cron from 'node-cron';
import { FinanceService } from '../modules/finance/finance.service';

const financeService = new FinanceService();

export const initCronJobs = () => {
    console.log('[Cron] Inicializando tareas programadas...');

    // 1. Facturación Mensual Automática
    // Se ejecuta todos los días a las 00:00 para revisar si algún conjunto tiene su billing_day hoy.
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Ejecutando revisión de facturación diaria...');
        try {
            await financeService.checkAndGenerateAllBills();
            console.log('[Cron] Revisión de facturación diaria completada con éxito.');
        } catch (error) {
            console.error('[Cron] Error en la revisión de facturación diaria:', error);
        }
    });

    // Se puede añadir más tareas aquí (ej: backups, reportes semanales, etc.)
};
