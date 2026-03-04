import fs from 'fs';
import path from 'path';
import { ImageCompressor } from './imageCompressor';

export class FileStorageService {
    private backupRootDir: string;
    private modules = {
        residentes: 'RESIDENTES',
        visitantes: 'VISITANTES',
        parqueaderos: 'PARQUEADEROS',
        amenidades: 'AMENIDADES',
        tienda: 'TIENDA',
        usuarios: 'USUARIOS',
        database: 'DATABASE',
        actas: 'ACTAS',
        access_logs: 'ACCESOS'
    };

    constructor() {
        this.backupRootDir = process.env.BACKUP_PATH || path.join(process.cwd(), 'BACKUP_SISTEMA_RESIDENCIAL');
        this.ensureAllDirectories();
        console.log('📁 Sistema de Backup Organizado con Compresión Activa');
    }

    private ensureAllDirectories() {
        if (!fs.existsSync(this.backupRootDir)) {
            fs.mkdirSync(this.backupRootDir, { recursive: true });
        }
        Object.values(this.modules).forEach((folderName) => {
            const modulePath = path.join(this.backupRootDir, folderName);
            if (!fs.existsSync(modulePath)) {
                fs.mkdirSync(modulePath, { recursive: true });
            }
        });
    }

    /**
     * Save a photo for a specific module with high-fidelity compression
     */
    async savePhoto(base64Data: string, module: keyof typeof this.modules, filename?: string): Promise<string> {
        try {
            // Fidelity settings: Higher for residents (biometric accuracy)
            const isResident = module === 'residentes' || module === 'usuarios';
            const compressedBuffer = await ImageCompressor.compress(base64Data, {
                quality: isResident ? 95 : 85
            });

            const timestamp = Date.now();
            const date = new Date().toISOString().split('T')[0];
            const randomStr = Math.random().toString(36).substring(7);

            // Using .webp for 80% better efficiency than PNG
            const finalFilename = filename
                ? `${filename}_${date}_${timestamp}.webp`
                : `foto_${date}_${timestamp}_${randomStr}.webp`;

            const moduleFolder = this.modules[module];
            const filepath = path.join(this.backupRootDir, moduleFolder, finalFilename);

            fs.writeFileSync(filepath, compressedBuffer);

            return `/backup/${moduleFolder}/${finalFilename}`;
        } catch (error) {
            console.error('❌ Error saving optimized photo:', error);
            throw new Error('Failed to save optimized photo');
        }
    }

    async backupDatabase(sourcePath: string): Promise<string> {
        try {
            const timestamp = Date.now();
            const date = new Date().toISOString().split('T')[0];
            const backupFilename = `backup_${date}_${timestamp}.db`;
            const destPath = path.join(this.backupRootDir, this.modules.database, backupFilename);
            fs.copyFileSync(sourcePath, destPath);
            this.cleanOldBackups();
            return destPath;
        } catch (error) {
            console.error('❌ Error backing up database:', error);
            throw error;
        }
    }

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

            if (files.length > 10) {
                files.slice(10).forEach(file => fs.unlinkSync(file.path));
            }
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }
    }

    deletePhoto(photoUrl: string): boolean {
        try {
            const urlParts = photoUrl.split('/');
            const filename = urlParts[urlParts.length - 1];
            const moduleFolder = urlParts[urlParts.length - 2];
            const filepath = path.join(this.backupRootDir, moduleFolder, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting photo:', error);
            return false;
        }
    }

    getModulePath(module: keyof typeof this.modules): string {
        return path.join(this.backupRootDir, this.modules[module]);
    }

    getBackupPath(): string { return this.backupRootDir; }
}

export const fileStorage = new FileStorageService();
