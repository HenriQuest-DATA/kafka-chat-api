import { consumer, CHAT_TOPIC } from '../config/kafka.js';
import { sendToUser } from './websocket.js';

export async function startMessageConsumer() {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        
        console.log('Mensagem recebida do Kafka:', {
          sender: data.sender_username,
          receiver: data.receiver_username,
          message: data.message,
          timestamp: data.created_at
        });

        const sent = sendToUser(data.receiver_id, {
          type: 'new_message',
          message: {
            id: data.id,
            senderId: data.sender_id,
            senderUsername: data.sender_username,
            receiverId: data.receiver_id,
            receiverUsername: data.receiver_username,
            message: data.message,
            createdAt: data.created_at
          }
        });

        if (sent) {
          console.log(`ensagem enviada via WebSocket para ${data.receiver_username}`);
        } else {
          console.log(`Usuário ${data.receiver_username} offline - mensagem salva no BD`);
        }

        sendToUser(data.sender_id, {
          type: 'message_sent',
          message: {
            id: data.id,
            receiverId: data.receiver_id,
            receiverUsername: data.receiver_username,
            message: data.message,
            createdAt: data.created_at
          }
        });
        
      } catch (error) {
        console.error('Erro ao processar mensagem do Kafka:', error);
      }
    },
  });
}