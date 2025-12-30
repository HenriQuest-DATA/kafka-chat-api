import express from 'express';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { getOnlineUsers, isUserOnline } from '../services/websocket.js';

const router = express.Router();

router.post('/friends', authenticateToken, async (req, res) => {
  try {
    const { friendUsername } = req.body;

    if (!friendUsername) {
      return res.status(400).json({ error: 'Username do amigo é obrigatório' });
    }

    const friendship = await User.addFriend(req.user.id, friendUsername);
    
    res.status(201).json({
      message: 'Amigo adicionado com sucesso',
      friendship
    });
  } catch (error) {
    console.error('Erro ao adicionar amigo:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const friends = await User.getFriends(req.user.id);
    
    const friendsWithStatus = friends.map(friend => ({
      ...friend,
      online: isUserOnline(friend.id)
    }));
    
    res.json({ friends: friendsWithStatus });
  } catch (error) {
    console.error('Erro ao buscar amigos:', error);
    res.status(500).json({ error: 'Erro ao buscar amigos' });
  }
});

router.get('/online', authenticateToken, async (req, res) => {
  try {
    const onlineUserIds = getOnlineUsers();
    res.json({ 
      onlineUsers: onlineUserIds,
      count: onlineUserIds.length 
    });
  } catch (error) {
    console.error('Erro ao buscar usuários online:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários online' });
  }
});

router.get('/status/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const online = isUserOnline(parseInt(userId));
    
    res.json({ 
      userId: parseInt(userId),
      online: online 
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

export default router;