import fs from 'fs';
import path from 'path';

export class FileStorageService {
    private backupRootDir: string;
    private modules = {
        residentes: 'RESIDENTES',
        visitantes: 'VISITANTES',
        parqueaderos: 'PARQUEADEROS',
        amenidades: 'AMENIDADES',
        tienda: 'TIENDA',
        usuarios: 'USUARIOS', // Nuevos usuarios del sistema
        database: 'DATABASE',
        actas: 'ACTAS',
        access_logs: 'ACCESOS' // Evidencias de acceso
    };

    constructor() {
        // Main backup directory
        this.backupRootDir = process.env.BACKUP_PATH || path.join(process.cwd(), 'BACKUP_SISTEMA_RESIDENCIAL');

        // Create all module directories
        this.ensureAllDirectories();

        console.log('📁 Sistema de Backup Organizado:');
        console.log('   Carpeta principal:', this.backupRootDir);
    }

    private ensureAllDirectories() {
        // Create root backup directory
        if (!fs.existsSync(this.backupRootDir)) {
            fs.mkdirSync(this.backupRootDir, { recursive: true });
            console.log('✅ Carpeta principal de backup creada');
        }

        // Create subdirectories for each module
        Object.entries(this.modules).forEach(([key, folderName]) => {
            const modulePath = path.join(this.backupRootDir, folderName);
            if (!fs.existsSync(modulePath)) {
                fs.mkdirSync(modulePath, { recursive: true });
                console.log(`   ✅ ${folderName}/`);
            }
        });
    }

    /**
     * Save a photo for a specific module
     * @param base64Data - Base64 encoded image
     * @param modulexport type ModuleType = 'residentes' | 'visitantes' | 'parqueaderos' | 'amenidades' | 'tienda' | 'usuarios' | 'database' | 'actas';
     */
    savePhoto(base64Data: string, module: keyof typeof this.modules, filename?: string): string {
        try {
            const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

            const timestamp = Date.now();
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const randomStr = Math.random().toString(36).substring(7);

            const finalFilename = filename
                ? `${filename}_${date}_${timestamp}.png`
                : `foto_${date}_${timestamp}_${randomStr}.png`;

            const moduleFolder = this.modules[module];
            const filepath = path.join(this.backupRootDir, moduleFolder, finalFilename);

            fs.writeFileSync(filepath, base64Image, 'base64');

            console.log(`✅ Foto guardada en ${moduleFolder}/${finalFilename}`);

            return `/backup/${moduleFolder}/${finalFilename}`;
        } catch (error) {
            console.error('❌ Error saving photo:', error);
            throw new Error('Failed to save photo');
        }
    }

    /**
     * Save database backup
     */
    async backupDatabase(sourcePath: string): Promise<string> {
        try {
            const timestamp = Date.now();
            const date = new Date().toISOString().split('T')[0];
            const backupFilename = `backup_${date}_${timestamp}.db`;

            const destPath = path.join(this.backupRootDir, this.modules.database, backupFilename);

            // Copy database file
            fs.copyFileSync(sourcePath, destPath);

            console.log(`💾 Base de datos respaldada: ${backupFilename}`);

            // Keep only last 10 backups
            this.cleanOldBackups();

            return destPath;
        } catch (error) {
            console.error('❌ Error backing up database:', error);
            throw error;
        }
    }

    /**
     * Clean old database backups (keep only last 10)
     */
    private cleanOldBackups() {
        try {
            const dbBackupDir = path.join(this.backupRootDir, this.modules.database);
            const files = fs.readdirSync(dbBackupDir)
                .filter(f => f.endsWith('.db'))
                .map(f => ({
                    name: f,
                    path: path.join(dbBackupDir, f),
                    time: fs.statSync(path.join(dbBackupDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time);

            // Keep only 10 most recent
            if (files.length > 10) {
                files.slice(10).forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️ Backup antiguo eliminado: ${file.name}`);
                });
            }
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }
    }

    /**
     * Delete a photo
     */
    deletePhoto(photoUrl: string): boolean {
        try {
            const urlParts = photoUrl.split('/');
            const filename = urlParts[urlParts.length - 1];
            const moduleFolder = urlParts[urlParts.length - 2];

            const filepath = path.join(this.backupRootDir, moduleFolder, filename);

            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(`🗑️ Foto eliminada: ${moduleFolder}/${filename}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting photo:', error);
            return false;
        }
    }

    /**
     * Get backup directory path
     */
    getBackupPath(): string {
        return this.backupRootDir;
    }

    /**
     * Get module directory path
     */
    getModulePath(module: keyof typeof this.modules): string {
        return path.join(this.backupRootDir, this.modules[module]);
    }
}

export const fileStorage = new FileStorageService();
