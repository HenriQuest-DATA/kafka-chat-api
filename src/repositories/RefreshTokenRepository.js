import prisma from '../config/database.js';

export class RefreshTokenRepository {
  async create(token, userId, expiresAt) {
    return await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async findByToken(token) {
    return await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteByToken(token) {
    return await prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteAllByUserId(userId) {
    return await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteById(id) {
    return await prisma.refreshToken.delete({
      where: { id },
    });
  }

  async deleteExpired() {
    return await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}