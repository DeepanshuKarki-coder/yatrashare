import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/errors';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.login(req.body.email, req.body.password, userAgent, ipAddress);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.refreshTokens(refreshToken, userAgent, ipAddress);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken;
      await authService.logout(refreshToken);
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userRepository.findById(req.user!.userId);
      if (!user) throw new NotFoundError('User not found');
      return res.status(200).json({ success: true, data: authService.formatUser(user) });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userRepository.update(req.user!.userId, {
        full_name: req.body.fullName,
        phone: req.body.phone,
        bio: req.body.bio,
        avatar_url: req.body.avatarUrl,
        emergency_contact_name: req.body.emergencyContactName,
        emergency_contact_phone: req.body.emergencyContactPhone,
      });
      return res.status(200).json({ success: true, data: authService.formatUser(updated) });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
