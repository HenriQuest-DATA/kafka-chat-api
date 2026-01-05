import prisma from '../config/database.js';

export class UserRepository {
  async create(username, hashedPassword) {
    return await prisma.user.create({
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
  }

  async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
  }

  async findWithPassword(username) {
    return await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        createdAt: true,
      },
    });
  }
}