import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const connections = new Map();

export function initWebSocketServer(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('Nova conexão WebSocket recebida');

    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.log('Conexão rejeitada: token não fornecido');
      ws.close(1008, 'Token não fornecido');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      const username = decoded.username;

      connections.set(userId, ws);
      console.log(`Usuário ${username} (ID: ${userId}) conectado via WebSocket`);

      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Conectado ao chat',
        userId,
        username
      }));

      broadcastOnlineUsers();

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Mensagem recebida do cliente:', message);

          switch (message.type) {
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
            case 'typing':
              handleTypingIndicator(userId, message);
              break;
            default:
              console.log('Tipo de mensagem desconhecido:', message.type);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem do cliente:', error);
        }
      });

      ws.on('close', () => {
        connections.delete(userId);
        console.log(`Usuário ${username} (ID: ${userId}) desconectado`);
        broadcastOnlineUsers();
      });

      ws.on('error', (error) => {
        console.error(`Erro no WebSocket do usuário ${userId}:`, error);
      });

    } catch (error) {
      console.log('Conexão rejeitada: token inválido');
      ws.close(1008, 'Token inválido');
    }
  });

  console.log('WebSocket Server iniciado em /ws');
  return wss;
}

export function sendToUser(userId, data) {
  const ws = connections.get(userId);
  
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(data));
    return true;
  }
  
  return false;
}

export function broadcast(data) {
  const message = JSON.stringify(data);
  
  connections.forEach((ws, userId) => {
    if (ws.readyState === 1) {
      ws.send(message);
    }
  });
}

function broadcastOnlineUsers() {
  const onlineUserIds = Array.from(connections.keys());
  
  broadcast({
    type: 'online_users',
    users: onlineUserIds,
    count: onlineUserIds.length
  });
}

function handleTypingIndicator(senderId, message) {
  const { receiverId, isTyping } = message;
  
  sendToUser(receiverId, {
    type: 'typing',
    senderId,
    isTyping
  });
}

export function isUserOnline(userId) {
  const ws = connections.get(userId);
  return !!(ws && ws.readyState === 1);
}

export function getOnlineUsers() {
  return Array.from(connections.keys());
}

export { connections };