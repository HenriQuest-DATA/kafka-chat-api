import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
const userController = new UserController();

router.post('/friends', authenticateToken, (req, res) => userController.addFriend(req, res));
router.get('/friends', authenticateToken, (req, res) => userController.getFriends(req, res));
router.get('/online', authenticateToken, (req, res) => userController.getOnlineUsers(req, res));
router.get('/status/:userId', authenticateToken, (req, res) => userController.getUserStatus(req, res));

export default router;