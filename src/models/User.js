import prisma from '../config/database.js';
import bcrypt from 'bcrypt';

export class User {
  static async create(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async findByUsername(username) {
    console.log("username:", username);
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
  }

  static async validatePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async addFriend(userId, friendUsername) {
    const friend = await User.findByUsername(friendUsername);
    
    if (!friend) {
      throw new Error('Usuário não encontrado');
    }

    if (userId === friend.id) {
      throw new Error('Você não pode adicionar a si mesmo');
    }

    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId: friend.id,
        },
      },
    });

    if (existingFriendship) {
      throw new Error('Vocês já são amigos');
    }

    const friendship = await prisma.friendship.create({
      data: {
        userId,
        friendId: friend.id,
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

    return friendship;
  }

  static async getFriends(userId) {
    const friendships = await prisma.friendship.findMany({
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

    return friendships.map(f => f.friend);
  }

  static async removeFriend(userId, friendId) {
    return await prisma.friendship.delete({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });
  }

  static async areFriends(userId, friendId) {
    const friendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    return !!friendship;
  }
}