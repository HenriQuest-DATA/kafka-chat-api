import prisma from '../config/database.js';

export class FriendshipRepository {
  async create(userId, friendId) {
    return await prisma.friendship.create({
      data: {
        userId,
        friendId,
      },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findByUsers(userId, friendId) {
    return await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });
  }

  async findAllByUserId(userId) {
    return await prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async delete(userId, friendId) {
    return await prisma.friendship.delete({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });
  }
}