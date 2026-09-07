import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { db } from '../../src/models/db';
import { authService } from '../../src/services/auth.service';
import { UserRole } from '@yatrashare/shared';

describe('Authentication Flow Integration', () => {
  before(async () => {
    await db.init();
  });

  const testEmail = `traveler_${Date.now()}@example.com`;
  let refreshToken = '';

  it('should successfully register a new user', async () => {
    const res = await authService.register({
      email: testEmail,
      password: 'SecurePassword123!',
      fullName: 'Ramesh Kumar',
      phone: '+919988776655',
      role: UserRole.USER,
    });

    assert.ok(res.user.id);
    assert.strictEqual(res.user.email, testEmail);
    assert.ok(res.accessToken);
    assert.ok(res.refreshToken);
    refreshToken = res.refreshToken;
  });

  it('should reject registration with duplicate email', async () => {
    await assert.rejects(
      async () => {
        await authService.register({
          email: testEmail,
          password: 'AnotherPassword123!',
          fullName: 'Duplicate Ramesh',
        });
      },
      { name: 'ConflictError' }
    );
  });

  it('should log in with valid credentials', async () => {
    const res = await authService.login(testEmail, 'SecurePassword123!');
    assert.ok(res.accessToken);
    assert.strictEqual(res.user.email, testEmail);
  });

  it('should fail login with invalid password', async () => {
    await assert.rejects(
      async () => {
        await authService.login(testEmail, 'WrongPassword!');
      },
      { name: 'UnauthorizedError' }
    );
  });

  it('should refresh access token using refresh token', async () => {
    const res = await authService.refreshTokens(refreshToken);
    assert.ok(res.accessToken);
    assert.ok(res.refreshToken);
    assert.strictEqual(res.user.email, testEmail);
  });
});
