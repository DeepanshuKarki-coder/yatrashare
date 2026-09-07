import { v4 as uuidv4 } from 'uuid';
import { userRepository, UserRecord } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { hashPassword, verifyPassword, hashToken, generateRandomToken } from '../utils/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UserRole, UserStatus } from '@yatrashare/shared';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { notificationService } from './notification/notification.service';
import { logger } from '../config/logger';

export class AuthService {
  async register(data: { email: string; password: string; fullName: string; phone?: string; role?: UserRole }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const userId = uuidv4();

    const user = await userRepository.create({
      id: userId,
      email: data.email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: data.fullName.trim(),
      phone: data.phone || null,
      role: data.role || UserRole.USER,
      is_email_verified: 0,
      is_phone_verified: 0,
      is_identity_verified: 0,
      status: UserStatus.ACTIVE,
    });

    const tokens = await this.issueTokenPair(user);

    // Dispatch welcome email asynchronously
    notificationService.sendEmail(
      user.email,
      'Welcome to YatraShare!',
      `<h1>Welcome to YatraShare, ${user.full_name}!</h1><p>Start discovering comfortable, affordable, and eco-friendly intercity journeys across India.</p>`
    ).catch((err) => logger.error('Welcome email failed', err));

    return { user: this.formatUser(user), ...tokens };
  }

  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedError('Your account has been permanently suspended. Please contact support.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedError('Your account is temporarily suspended. Please contact support.');
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.issueTokenPair(user, userAgent, ipAddress);
    return { user: this.formatUser(user), ...tokens };
  }

  async refreshTokens(refreshToken: string, userAgent?: string, ipAddress?: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const session = await sessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      // Possible token reuse attack detected! Revoke the entire family
      if (payload.familyId) {
        logger.warn(`Potential refresh token reuse detected! Revoking family ${payload.familyId}`);
        await sessionRepository.revokeFamily(payload.familyId);
      }
      throw new UnauthorizedError('Invalid session token');
    }

    // Delete used session
    await sessionRepository.deleteById(session.id);

    const user = await userRepository.findById(payload.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('User account not active');
    }

    // Issue new pair maintaining the same familyId
    const newFamilyId = session.family_id;
    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      familyId: newFamilyId,
    });

    const newRefreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      familyId: newFamilyId,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await sessionRepository.createSession({
      id: uuidv4(),
      user_id: user.id,
      token_hash: hashToken(newRefreshToken),
      family_id: newFamilyId,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.formatUser(user),
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      const session = await sessionRepository.findByTokenHash(tokenHash);
      if (session) {
        await sessionRepository.deleteById(session.id);
      }
    }
  }

  private async issueTokenPair(user: UserRecord, userAgent?: string, ipAddress?: string) {
    const familyId = uuidv4();

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      familyId,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      familyId,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await sessionRepository.createSession({
      id: uuidv4(),
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      family_id: familyId,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    });

    return { accessToken, refreshToken };
  }

  formatUser(u: UserRecord) {
    return {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      phone: u.phone,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      role: u.role,
      isEmailVerified: !!u.is_email_verified,
      isPhoneVerified: !!u.is_phone_verified,
      isIdentityVerified: !!u.is_identity_verified,
      ratingAverage: u.rating_average,
      ratingCount: u.rating_count,
      completedRidesCount: u.completed_rides_count,
      status: u.status,
      emergencyContactName: u.emergency_contact_name,
      emergencyContactPhone: u.emergency_contact_phone,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  }
}

export const authService = new AuthService();
