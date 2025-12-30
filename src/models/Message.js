import prisma from '../config/database.js';

export class Message {
  static async create(senderId, receiverId, message) {
    return await prisma.message.create({
      data: {
        senderId,
        receiverId,
        message,
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  static async getHistory(userId1, userId2, limit = 50) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            AND: [
              { senderId: userId1 },
              { receiverId: userId2 },
            ],
          },
          {
            AND: [
              { senderId: userId2 },
              { receiverId: userId1 },
            ],
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    return messages;
  }

  static async markAsRead(receiverId, senderId) {
    const result = await prisma.message.updateMany({
      where: {
        receiverId,
        senderId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  static async countUnread(receiverId, senderId) {
    return await prisma.message.count({
      where: {
        receiverId,
        senderId,
        read: false,
      },
    });
  }

  static async countAllUnread(receiverId) {
    return await prisma.message.count({
      where: {
        receiverId,
        read: false,
      },
    });
  }

  static async getConversationsWithUnread(userId) {
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT ON (other_user_id)
        other_user_id,
        other_username,
        last_message,
        last_message_time,
        unread_count
      FROM (
        SELECT 
          CASE 
            WHEN m.sender_id = ${userId} THEN m.receiver_id 
            ELSE m.sender_id 
          END as other_user_id,
          CASE 
            WHEN m.sender_id = ${userId} THEN u2.username 
            ELSE u1.username 
          END as other_username,
          m.message as last_message,
          m.created_at as last_message_time,
          (
            SELECT COUNT(*)::int 
            FROM messages 
            WHERE receiver_id = ${userId} 
              AND sender_id = CASE 
                WHEN m.sender_id = ${userId} THEN m.receiver_id 
                ELSE m.sender_id 
              END
              AND read = false
          ) as unread_count
        FROM messages m
        JOIN users u1 ON m.sender_id = u1.id
        JOIN users u2 ON m.receiver_id = u2.id
        WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
        ORDER BY m.created_at DESC
      ) conversations
      ORDER BY other_user_id, last_message_time DESC
    `;

    return conversations;
  }

  static async delete(messageId, userId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== userId) {
      throw new Error('Você não pode deletar esta mensagem');
    }

    return await prisma.message.delete({
      where: { id: messageId },
    });
  }
}