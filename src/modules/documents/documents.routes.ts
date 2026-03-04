import { Router } from 'express';
import * as controller from './documents.controller';
import { authenticate, authorize } from '../../core/auth.middleware';

const router = Router();

router.use(authenticate);

// Folders
router.get('/folders', controller.getFolders);
router.post('/folders', authorize(['admin']), controller.createFolder);
router.delete('/folders/:id', authorize(['admin']), controller.deleteFolder);

// Files
router.get('/folders/:folderId/files', controller.getFiles);
router.post('/folders/:folderId/files', authorize(['admin']), controller.uploadFile);
router.delete('/files/:id', authorize(['admin']), controller.deleteFile);

// Specialized
router.post('/export-pdf', authorize(['admin']), controller.exportToPdf);

export default router;
