import { AuthService } from '../services/authService.js';
import { UserService } from '../services/userService.js';

const authService = new AuthService();
const userService = new UserService();

export class AuthController {
  async register(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username e password são obrigatórios' });
      }

      const user = await userService.createUser(username, password);
      
      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error.message === 'Usuário já existe') {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username e password são obrigatórios' });
      }

      const user = await userService.validateCredentials(username, password);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const accessToken = authService.generateAccessToken(user);
      const refreshToken = await authService.createRefreshToken(user.id);

      res.json({
        message: 'Login realizado com sucesso',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token não fornecido' });
      }

      const newAccessToken = await authService.refreshAccessToken(refreshToken);

      res.json({
        message: 'Token renovado com sucesso',
        accessToken: newAccessToken
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      res.status(403).json({ error: error.message });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token não fornecido' });
      }

      await authService.revokeRefreshToken(refreshToken);

      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro ao fazer logout' });
    }
  }
}