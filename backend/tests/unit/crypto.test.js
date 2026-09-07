"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const crypto_1 = require("../../src/utils/crypto");
(0, node_test_1.describe)('Crypto Utilities', () => {
    (0, node_test_1.it)('should hash and verify passwords correctly', async () => {
        const raw = 'SecurePassword123!';
        const hash = await (0, crypto_1.hashPassword)(raw);
        node_assert_1.default.notStrictEqual(raw, hash);
        node_assert_1.default.ok(hash.startsWith('$2')); // bcrypt prefix
        const isValid = await (0, crypto_1.verifyPassword)(raw, hash);
        node_assert_1.default.strictEqual(isValid, true);
        const isWrong = await (0, crypto_1.verifyPassword)('WrongPassword', hash);
        node_assert_1.default.strictEqual(isWrong, false);
    });
    (0, node_test_1.it)('should generate secure random hex tokens and hash them consistently', () => {
        const token1 = (0, crypto_1.generateRandomToken)(16);
        const token2 = (0, crypto_1.generateRandomToken)(16);
        node_assert_1.default.strictEqual(token1.length, 32);
        node_assert_1.default.notStrictEqual(token1, token2);
        const hash1 = (0, crypto_1.hashToken)(token1);
        const hash1Again = (0, crypto_1.hashToken)(token1);
        node_assert_1.default.strictEqual(hash1, hash1Again);
    });
});
