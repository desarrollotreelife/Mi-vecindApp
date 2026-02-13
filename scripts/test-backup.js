const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBackupSystem() {
    console.log('🧪 Probando Sistema de Backup...\n');

    // Import backup service
    const { backupService } = require('./src/services/backup.service');

    try {
        // Test 1: Create manual backup
        console.log('1️⃣ Creando backup manual...');
        await backupService.createDailyBackup();

        // Test 2: List backups
        console.log('\n2️⃣ Listando backups disponibles:');
        const backups = backupService.listBackups();
        backups.forEach((backup, i) => {
            console.log(`   ${i + 1}. Día ${backup.day}: ${backup.filename} (${backup.size})`);
        });

        // Test 3: Show statistics
        console.log('\n3️⃣ Estadísticas de backup:');
        const stats = backupService.getBackupStats();
        console.log(`   Total de backups: ${stats.total}`);
        console.log(`   Día más antiguo: ${stats.oldestDay}`);
        console.log(`   Día más reciente: ${stats.newestDay}`);
        console.log(`   Tamaño total: ${stats.totalSize}`);

        console.log('\n✅ Sistema de backup funcionando correctamente!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testBackupSystem();
