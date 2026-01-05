import { UserService } from '../services/userService.js';
import { isUserOnline, getOnlineUsers } from '../services/websocket.js';

const userService = new UserService();

export class UserController {
  async addFriend(req, res) {
    try {
      const { friendUsername } = req.body;

      if (!friendUsername) {
        return res.status(400).json({ error: 'Nome do amigo é obrigatório' });
      }

      const friendship = await userService.addFriend(req.user.id, friendUsername);

      res.status(201).json({
        message: 'Amigo adicionado com sucesso',
        friend: friendship.friend
      });
    } catch (error) {
      console.error('Erro ao adicionar amigo:', error);
      
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message === 'Você não pode adicionar a si mesmo' || 
          error.message === 'Vocês já são amigos') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao adicionar amigo' });
    }
  }

  async getFriends(req, res) {
    try {
      const friends = await userService.getFriends(req.user.id);
      
      const friendsWithStatus = friends.map(friend => ({
        ...friend,
        online: isUserOnline(friend.id)
      }));

      res.json({ friends: friendsWithStatus });
    } catch (error) {
      console.error('Erro ao buscar amigos:', error);
      res.status(500).json({ error: 'Erro ao buscar amigos' });
    }
  }

  async getOnlineUsers(req, res) {
    try {
      const onlineUserIds = getOnlineUsers();
      
      res.json({
        online: onlineUserIds,
        count: onlineUserIds.length
      });
    } catch (error) {
      console.error('Erro ao buscar usuários online:', error);
      res.status(500).json({ error: 'Erro ao buscar usuários online' });
    }
  }

  async getUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const online = isUserOnline(userId);
      
      res.json({ 
        userId,
        online 
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      res.status(500).json({ error: 'Erro ao verificar status' });
    }
  }
}