import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hashPassword, verifyPassword, generateRandomToken, hashToken } from '../../src/utils/crypto';

describe('Crypto Utilities', () => {
  it('should hash and verify passwords correctly', async () => {
    const raw = 'SecurePassword123!';
    const hash = await hashPassword(raw);

    assert.notStrictEqual(raw, hash);
    assert.ok(hash.startsWith('$2')); // bcrypt prefix

    const isValid = await verifyPassword(raw, hash);
    assert.strictEqual(isValid, true);

    const isWrong = await verifyPassword('WrongPassword', hash);
    assert.strictEqual(isWrong, false);
  });

  it('should generate secure random hex tokens and hash them consistently', () => {
    const token1 = generateRandomToken(16);
    const token2 = generateRandomToken(16);

    assert.strictEqual(token1.length, 32);
    assert.notStrictEqual(token1, token2);

    const hash1 = hashToken(token1);
    const hash1Again = hashToken(token1);
    assert.strictEqual(hash1, hash1Again);
  });
});
