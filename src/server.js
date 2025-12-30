import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, disconnectDatabase } from './config/database.js';
import { initProducer, initConsumer } from './config/kafka.js';
import { startMessageConsumer } from './services/messageConsumer.js';
import { initWebSocketServer } from './services/websocket.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';

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
  res.json({ status: 'OK', message: 'Servidor funcionando com Prisma e WebSocket!' });
});

async function startServer() {
  try {
    console.log('Conectando ao banco de dados com Prisma...');
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
      console.log(`\nServidor rodando na porta ${PORT}`);
      console.log(`HTTP: http://localhost:${PORT}`);
      console.log(`WebSocket: ws://localhost:${PORT}/ws?token=YOUR_JWT_TOKEN\n`);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ENDPOINTS DISPONÍVEIS:\n');
      
      console.log('AUTENTICAÇÃO:');
      console.log('  POST   /api/auth/register         - Registrar novo usuário');
      console.log('  POST   /api/auth/login            - Fazer login\n');
      
      console.log('USUÁRIOS E AMIZADES:');
      console.log('  POST   /api/users/friends                 - Adicionar amigo');
      console.log('  GET    /api/users/friends                 - Listar amigos (com status online)');
      console.log('  GET    /api/users/online                  - Listar todos usuários online');
      console.log('  GET    /api/users/status/:userId          - Verificar se usuário está online\n');
      
      console.log('MENSAGENS:');
      console.log('  POST   /api/messages                   - Enviar mensagem');
      console.log('  GET    /api/messages/history           - Histórico de mensagens');
      console.log('  PUT    /api/messages/read              - Marcar mensagens como lidas');
      console.log('  GET    /api/messages/unread            - Contar não lidas de um usuário');
      console.log('  GET    /api/messages/conversations     - Listar conversas com contadores\n');
      
      console.log('SAÚDE:');
      console.log('  GET    /health                    - Status do servidor');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('Encerrando servidor...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Encerrando servidor...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();