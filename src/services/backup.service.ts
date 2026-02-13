import fs from 'fs';
import path from 'path';
import { fileStorage } from '../utils/fileStorage';

export class BackupService {
    private dbPath: string;
    private backupDir: string;
    private maxBackupDays = 31; // Mantener últimos 31 días

    constructor() {
        this.dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
        this.backupDir = fileStorage.getModulePath('database');
    }

    /**
     * Create daily backup with day number (1-31)
     */
    async createDailyBackup(): Promise<string> {
        try {
            const now = new Date();
            const dayOfMonth = now.getDate(); // 1-31
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

            // Filename format: backup_dia_DD_YYYY-MM-DD_HH-MM-SS.db
            const backupFilename = `backup_dia_${String(dayOfMonth).padStart(2, '0')}_${dateStr}_${timeStr}.db`;
            const backupPath = path.join(this.backupDir, backupFilename);

            // Check if database exists
            if (!fs.existsSync(this.dbPath)) {
                throw new Error('Database file not found');
            }

            // Delete old backups for this day of month (rotation)
            this.rotateBackups(dayOfMonth);

            // Copy database
            fs.copyFileSync(this.dbPath, backupPath);

            const fileSize = (fs.statSync(backupPath).size / 1024).toFixed(2);
            console.log(`💾 Backup diario creado: ${backupFilename} (${fileSize} KB)`);

            // Clean old backups (keep only last 31 days)
            this.cleanOldBackups();

            return backupPath;
        } catch (error) {
            console.error('❌ Error creating daily backup:', error);
            throw error;
        }
    }

    /**
     * Rotate backups - delete old backups for the same day of month
     * Example: When day 32 arrives (day 1 of next month), delete old day 1 backups
     */
    private rotateBackups(currentDay: number) {
        try {
            const dayPattern = `backup_dia_${String(currentDay).padStart(2, '0')}_`;
            const files = fs.readdirSync(this.backupDir);

            // Find and delete old backups for this day
            const oldBackups = files.filter(f => f.startsWith(dayPattern));

            if (oldBackups.length > 0) {
                console.log(`🔄 Rotando backups del día ${currentDay}...`);
                oldBackups.forEach(file => {
                    const filePath = path.join(this.backupDir, file);
                    fs.unlinkSync(filePath);
                    console.log(`   🗑️ Eliminado: ${file}`);
                });
            }
        } catch (error) {
            console.error('Error rotating backups:', error);
        }
    }

    /**
     * Clean backups older than 31 days
     */
    private cleanOldBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.endsWith('.db'))
                .map(f => ({
                    name: f,
                    path: path.join(this.backupDir, f),
                    time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time); // Newest first

            // Keep only last 31
            if (files.length > this.maxBackupDays) {
                const toDelete = files.slice(this.maxBackupDays);
                console.log(`🧹 Limpiando backups antiguos (más de ${this.maxBackupDays} días)...`);
                toDelete.forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log(`   🗑️ Eliminado: ${file.name}`);
                });
            }
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }
    }

    /**
     * List all available backups
     */
    listBackups(): Array<{ filename: string; date: string; size: string; day: number }> {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.endsWith('.db'))
                .map(f => {
                    const stats = fs.statSync(path.join(this.backupDir, f));
                    const dayMatch = f.match(/backup_dia_(\d+)_/);
                    const day = dayMatch ? parseInt(dayMatch[1]) : 0;

                    return {
                        filename: f,
                        date: stats.mtime.toISOString().split('T')[0],
                        size: (stats.size / 1024).toFixed(2) + ' KB',
                        day: day
                    };
                })
                .sort((a, b) => b.day - a.day);

            return files;
        } catch (error) {
            console.error('Error listing backups:', error);
            return [];
        }
    }

    /**
     * Restore from a specific backup
     */
    async restoreBackup(backupFilename: string): Promise<void> {
        try {
            const backupPath = path.join(this.backupDir, backupFilename);

            if (!fs.existsSync(backupPath)) {
                throw new Error('Backup file not found');
            }

            // Create a backup of current database before restoring
            const currentBackup = path.join(this.backupDir, `pre-restore_${Date.now()}.db`);
            fs.copyFileSync(this.dbPath, currentBackup);
            console.log(`💾 Backup actual guardado: ${path.basename(currentBackup)}`);

            // Restore
            fs.copyFileSync(backupPath, this.dbPath);
            console.log(`✅ Base de datos restaurada desde: ${backupFilename}`);
        } catch (error) {
            console.error('❌ Error restoring backup:', error);
            throw error;
        }
    }

    /**
     * Get backup statistics
     */
    getBackupStats(): { total: number; oldestDay: number; newestDay: number; totalSize: string } {
        const backups = this.listBackups();
        const totalSize = backups.reduce((sum, b) => sum + parseFloat(b.size), 0).toFixed(2);

        return {
            total: backups.length,
            oldestDay: backups.length > 0 ? Math.min(...backups.map(b => b.day)) : 0,
            newestDay: backups.length > 0 ? Math.max(...backups.map(b => b.day)) : 0,
            totalSize: totalSize + ' KB'
        };
    }
}

export const backupService = new BackupService();
