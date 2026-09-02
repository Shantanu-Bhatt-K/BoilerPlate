import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { MAX_FILES_PER_UPLOAD } from '../config/constants.js';
import {
  uploadFile,
  uploadFiles,
  deleteFile,
  restoreFile,
  getFile,
} from '../controllers/file.controller.js';

const router = Router();

router.post('/files', upload.single('file'), uploadFile);
router.post(
  '/files/batch',
  upload.array('files', MAX_FILES_PER_UPLOAD),
  uploadFiles
);
router.delete('/files/:filename', deleteFile);
router.post('/files/:filename/restore', restoreFile);
router.get('/files/:filename', getFile);
export default router;
