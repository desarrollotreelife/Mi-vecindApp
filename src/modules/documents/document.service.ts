import { prisma } from '../../core/prisma';

export class DocumentService {
    // --- Folder Management ---

    async listFolders(complexId: number, parentId: number | null = null) {
        return prisma.documentFolder.findMany({
            where: {
                complex_id: complexId,
                parent_id: parentId
            },
            include: {
                _count: {
                    select: {
                        files: true,
                        subfolders: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async createFolder(complexId: number, data: { name: string, description?: string, parentId?: number }) {
        return prisma.documentFolder.create({
            data: {
                name: data.name,
                description: data.description,
                parent_id: data.parentId ? Number(data.parentId) : null,
                complex_id: complexId
            }
        });
    }

    async deleteFolder(id: number) {
        // Note: Real implementation should check for files/subfolders or delete recursively
        return prisma.documentFolder.delete({
            where: { id }
        });
    }

    // --- File Management ---

    async listFiles(folderId: number) {
        return prisma.documentFile.findMany({
            where: { folder_id: folderId },
            orderBy: { created_at: 'desc' }
        });
    }

    async uploadFile(folderId: number, data: { name: string, file_url: string, file_type: string, file_size?: number }) {
        return prisma.documentFile.create({
            data: {
                name: data.name,
                file_url: data.file_url,
                file_type: data.file_type,
                file_size: data.file_size,
                folder_id: folderId
            }
        });
    }

    async deleteFile(id: number) {
        return prisma.documentFile.delete({
            where: { id }
        });
    }

    // --- PDF Conversion (Placeholder for now) ---
    // In a real scenario, we'd use 'pdf-lib' or 'puppeteer'
    async generatePdfFromHtml(title: string, content: string) {
        // This would return a buffer or URL to the generated PDF
        console.log(`Generating PDF for: ${title}`);
        return {
            name: `${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
            url: `/uploads/documents/generated_placeholder.pdf` // Placeholder
        };
    }
}
