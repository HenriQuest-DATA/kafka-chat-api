import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository.js';

dotenv.config();

const refreshTokenRepo = new RefreshTokenRepository();

export class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  async createRefreshToken(userId) {
    const token = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await refreshTokenRepo.create(token, userId, expiresAt);
    return token;
  }

  async refreshAccessToken(refreshToken) {
    const storedToken = await refreshTokenRepo.findByToken(refreshToken);

    if (!storedToken) {
      throw new Error('Refresh token inválido');
    }

    if (new Date() > storedToken.expiresAt) {
      await refreshTokenRepo.deleteById(storedToken.id);
      throw new Error('Refresh token expirado');
    }

    return this.generateAccessToken(storedToken.user);
  }

  async revokeRefreshToken(refreshToken) {
    await refreshTokenRepo.deleteByToken(refreshToken);
  }

  async revokeAllUserTokens(userId) {
    await refreshTokenRepo.deleteAllByUserId(userId);
  }
}