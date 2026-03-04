import { Request, Response } from 'express';
import { DocumentService } from './document.service';

const service = new DocumentService();

export const getFolders = async (req: any, res: Response) => {
    try {
        const complexId = Number(req.query.complexId) || 1;
        const parentId = req.query.parentId ? Number(req.query.parentId) : null;
        const folders = await service.listFolders(complexId, parentId);
        res.json(folders);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createFolder = async (req: any, res: Response) => {
    try {
        const complexId = Number(req.body.complexId) || 1;
        const folder = await service.createFolder(complexId, req.body);
        res.status(201).json(folder);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteFolder = async (req: Request, res: Response) => {
    try {
        await service.deleteFolder(Number(req.params.id));
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getFiles = async (req: Request, res: Response) => {
    try {
        const folderId = Number(req.params.folderId);
        const files = await service.listFiles(folderId);
        res.json(files);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const uploadFile = async (req: Request, res: Response) => {
    try {
        const folderId = Number(req.params.folderId);
        const file = await service.uploadFile(folderId, req.body);
        res.status(201).json(file);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        await service.deleteFile(Number(req.params.id));
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const exportToPdf = async (req: any, res: Response) => {
    try {
        const { title, content, folderId } = req.body;
        const result = await service.generatePdfFromHtml(title, content);

        // In a real app, we'd save this 'result.url' as a DocumentFile in folderId
        const file = await service.uploadFile(Number(folderId), {
            name: result.name,
            file_url: result.url,
            file_type: 'pdf'
        });

        res.status(201).json(file);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
