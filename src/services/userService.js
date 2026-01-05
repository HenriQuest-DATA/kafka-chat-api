import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/UserRepository.js';
import { FriendshipRepository } from '../repositories/FriendshipRepository.js';

const userRepo = new UserRepository();
const friendshipRepo = new FriendshipRepository();

export class UserService {
  async createUser(username, password) {
    const existingUser = await userRepo.findByUsername(username);
    if (existingUser) {
      throw new Error('Usuário já existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return await userRepo.create(username, hashedPassword);
  }

  async validateCredentials(username, password) {
    const user = await userRepo.findWithPassword(username);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async addFriend(userId, friendUsername) {
    const friend = await userRepo.findByUsername(friendUsername);
    
    if (!friend) {
      throw new Error('Usuário não encontrado');
    }

    if (userId === friend.id) {
      throw new Error('Você não pode adicionar a si mesmo');
    }

    const existingFriendship = await friendshipRepo.findByUsers(userId, friend.id);
    if (existingFriendship) {
      throw new Error('Vocês já são amigos');
    }

    return await friendshipRepo.create(userId, friend.id);
  }

  async getFriends(userId) {
    const friendships = await friendshipRepo.findAllByUserId(userId);
    return friendships.map(f => f.friend);
  }
}