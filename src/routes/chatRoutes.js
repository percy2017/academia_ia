import express from 'express';
import { getChatHistory, uploadChatFile } from '../controllers/chatController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/mediaUploadMiddleware.js';

const router = express.Router();

router.get('/history/:lessonId', isAuthenticated, getChatHistory);
router.post('/upload', isAuthenticated, upload.single('file'), uploadChatFile);

export default router;
