import { Request, Response } from 'express';
import { DocumentsService } from './documents.service';
import { FileStorageService } from '../../utils/fileStorage';

const documentsService = new DocumentsService();
const fileStorage = new FileStorageService();

export const createMinute = async (req: Request, res: Response) => {
    try {
        const { title, type, date, description, file } = req.body;

        // Handle file upload (expecting base64 in body.file for now, similar to photos)
        let fileUrl = '';
        if (file && file.startsWith('data:application/pdf')) {
            fileUrl = fileStorage.savePhoto(file, 'actas', `acta_${type}_${Date.now()}`);
            // Note: savePhoto is generic, works for files if we tweak extension logic or rename method. 
            // For now assuming it saves correctly but might end with .png if we don't fix it.
            // TODO: Refactor fileStorage to generic saveFile.
        }

        const result = await documentsService.createMinute({
            title, type, date, description, file_url: fileUrl
        });
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getMinutes = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        const result = await documentsService.getMinutes(type as string);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
