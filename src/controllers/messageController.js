import { MessageService } from '../services/messageService.js';

const messageService = new MessageService();

export class MessageController {
  async sendMessage(req, res) {
    try {
      const { receiverUsername, message } = req.body;

      if (!receiverUsername || !message) {
        return res.status(400).json({ error: 'Destinatário e mensagem são obrigatórios' });
      }

      const savedMessage = await messageService.sendMessage(
        req.user.id,
        req.user.username,
        receiverUsername,
        message
      );

      res.status(201).json({
        message: 'Mensagem enviada com sucesso',
        data: savedMessage
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      if (error.message === 'Destinatário não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
  }

  async getHistory(req, res) {
    try {
      const { username } = req.query;
      const limit = parseInt(req.query.limit) || 50;

      if (!username) {
        return res.status(400).json({ error: 'Username é obrigatório' });
      }

      const messages = await messageService.getHistory(req.user.id, username, limit);
      
      res.json({ messages });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  }

  async markAsRead(req, res) {
    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: 'Username é obrigatório' });
      }

      const count = await messageService.markAsRead(req.user.id, username);

      res.json({ 
        message: 'Mensagens marcadas como lidas',
        count 
      });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao marcar como lida' });
    }
  }

  async countUnread(req, res) {
    try {
      const { username } = req.query;

      const count = await messageService.countUnread(req.user.id, username);

      res.json({ count });
    } catch (error) {
      console.error('Erro ao contar não lidas:', error);
      
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao contar não lidas' });
    }
  }

  async getConversations(req, res) {
    try {
      const conversations = await messageService.getConversations(req.user.id);

      res.json({ conversations });
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      res.status(500).json({ error: 'Erro ao buscar conversas' });
    }
  }
}