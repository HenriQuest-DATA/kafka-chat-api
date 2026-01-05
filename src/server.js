import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, disconnectDatabase } from './config/database.js';
import { initProducer, initConsumer } from './config/kafka.js';
import { startMessageConsumer } from './services/messageConsumer.js';
import { initWebSocketServer } from './services/websocket.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando!' });
});

async function startServer() {
  try {
    console.log('Conectando ao banco de dados...');
    await initDatabase();

    console.log('Conectando ao Kafka Producer...');
    await initProducer();

    console.log('Conectando ao Kafka Consumer...');
    await initConsumer();

    console.log('Iniciando consumer de mensagens...');
    await startMessageConsumer();

    console.log('Iniciando WebSocket Server...');
    initWebSocketServer(server);

    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`HTTP: http://localhost:${PORT}`);
      console.log(`WebSocket: ws://localhost:${PORT}/ws?token=YOUR_JWT_TOKEN\n`);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ENDPOINTS DISPONÍVEIS:\n');
      
      console.log('AUTENTICAÇÃO:');
      console.log('  POST   /api/auth/register         - Registrar usuário');
      console.log('  POST   /api/auth/login            - Login');
      console.log('  POST   /api/auth/refresh          - Renovar token');
      console.log('  POST   /api/auth/logout           - Logout\n');
      
      console.log('USUÁRIOS:');
      console.log('  POST   /api/users/friends         - Adicionar amigo');
      console.log('  GET    /api/users/friends         - Listar amigos');
      console.log('  GET    /api/users/online          - Usuários online');
      console.log('  GET    /api/users/status/:userId  - Status do usuário\n');
      
      console.log('MENSAGENS:');
      console.log('  POST   /api/messages              - Enviar mensagem');
      console.log('  GET    /api/messages/history      - Histórico');
      console.log('  PUT    /api/messages/read         - Marcar como lida');
      console.log('  GET    /api/messages/unread       - Contar não lidas');
      console.log('  GET    /api/messages/conversations - Conversas\n');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nEncerrando servidor...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();