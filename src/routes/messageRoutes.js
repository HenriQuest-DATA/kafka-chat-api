import express from 'express';
import { MessageController } from '../controllers/messageController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
const messageController = new MessageController();

router.post('/', authenticateToken, (req, res) => messageController.sendMessage(req, res));
router.get('/history', authenticateToken, (req, res) => messageController.getHistory(req, res));
router.put('/read', authenticateToken, (req, res) => messageController.markAsRead(req, res));
router.get('/unread', authenticateToken, (req, res) => messageController.countUnread(req, res));
router.get('/conversations', authenticateToken, (req, res) => messageController.getConversations(req, res));

export default router;