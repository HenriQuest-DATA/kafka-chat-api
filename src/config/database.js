import prisma from './prisma.js';

export async function initDatabase() {
  try {
    await prisma.$connect();
    console.log('Conectado com sucesso ao banco.');
  } catch (error) {
    console.error('Erro ao conectar no banco:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;