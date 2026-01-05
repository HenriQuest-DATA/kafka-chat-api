import { MessageRepository } from '../repositories/MessageRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { publishMessage } from '../config/kafka.js';

const messageRepo = new MessageRepository();
const userRepo = new UserRepository();

export class MessageService {
  async sendMessage(senderId, senderUsername, receiverUsername, message) {
    const receiver = await userRepo.findByUsername(receiverUsername);
    
    if (!receiver) {
      throw new Error('Destinatário não encontrado');
    }

    const savedMessage = await messageRepo.create(senderId, receiver.id, message);

    await publishMessage({
      id: savedMessage.id,
      sender_id: senderId,
      sender_username: senderUsername,
      receiver_id: receiver.id,
      receiver_username: receiver.username,
      message: savedMessage.message,
      created_at: savedMessage.createdAt
    });

    return savedMessage;
  }

  async getHistory(userId, otherUsername, limit = 50) {
    const otherUser = await userRepo.findByUsername(otherUsername);
    
    if (!otherUser) {
      throw new Error('Usuário não encontrado');
    }

    return await messageRepo.findHistory(userId, otherUser.id, limit);
  }

  async markAsRead(receiverId, senderUsername) {
    if (!senderUsername) {
      return 0;
    }

    const sender = await userRepo.findByUsername(senderUsername);
    
    if (!sender) {
      throw new Error('Usuário não encontrado');
    }

    const result = await messageRepo.markAsRead(receiverId, sender.id);
    return result.count;
  }

  async countUnread(receiverId, senderUsername = null) {
    if (!senderUsername) {
      return await messageRepo.countUnread(receiverId);
    }

    const sender = await userRepo.findByUsername(senderUsername);
    
    if (!sender) {
      throw new Error('Usuário não encontrado');
    }

    return await messageRepo.countUnread(receiverId, sender.id);
  }

  async getConversations(userId) {
    return await messageRepo.findConversationsWithUnread(userId);
  }
}