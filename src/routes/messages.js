import express from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { publishMessage } from '../config/kafka.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { receiverUsername, message } = req.body;

    if (!receiverUsername || !message) {
      return res.status(400).json({ error: 'Destinatário e mensagem são obrigatórios' });
    }

    const receiver = await User.findByUsername(receiverUsername);
    if (!receiver) {
      return res.status(404).json({ error: 'Destinatário não encontrado' });
    }

    const savedMessage = await Message.create(req.user.id, receiver.id, message);

    await publishMessage({
      id: savedMessage.id,
      sender_id: req.user.id,
      sender_username: req.user.username,
      receiver_id: receiver.id,
      receiver_username: receiver.username,
      message: savedMessage.message,
      created_at: savedMessage.created_at
    });

    res.status(201).json({
      message: 'Mensagem enviada com sucesso',
      data: savedMessage
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { username } = req.user
    const limit = parseInt(req.query.limit) || 50;

    const otherUser = await User.findByUsername(username);
    if (!otherUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const messages = await Message.getHistory(req.user.id, otherUser.id, limit);
    
    res.json({ messages });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

router.put('/read', authenticateToken, async (req, res) => {
  try {
    const { username } = req.user;

    const sender = await User.findByUsername(username);
    if (!sender) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const count = await Message.markAsRead(req.user.id, sender.id);

    res.json({ 
      message: 'Mensagens marcadas como lidas',
      count 
    });
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar como lida' });
  }
});

router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const { username } = req.user;

    const sender = await User.findByUsername(username);
    if (!sender) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const count = await Message.countUnread(req.user.id, sender.id);

    res.json({ count });
  } catch (error) {
    console.error('Erro ao contar não lidas:', error);
    res.status(500).json({ error: 'Erro ao contar não lidas' });
  }
});

router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Message.getConversationsWithUnread(req.user.id);

    res.json({ conversations });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

export default router;