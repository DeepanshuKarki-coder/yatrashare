"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const db_1 = require("../../src/models/db");
const auth_service_1 = require("../../src/services/auth.service");
const shared_1 = require("@yatrashare/shared");
(0, node_test_1.describe)('Authentication Flow Integration', () => {
    (0, node_test_1.before)(async () => {
        await db_1.db.init();
    });
    const testEmail = `traveler_${Date.now()}@example.com`;
    let refreshToken = '';
    (0, node_test_1.it)('should successfully register a new user', async () => {
        const res = await auth_service_1.authService.register({
            email: testEmail,
            password: 'SecurePassword123!',
            fullName: 'Ramesh Kumar',
            phone: '+919988776655',
            role: shared_1.UserRole.USER,
        });
        node_assert_1.default.ok(res.user.id);
        node_assert_1.default.strictEqual(res.user.email, testEmail);
        node_assert_1.default.ok(res.accessToken);
        node_assert_1.default.ok(res.refreshToken);
        refreshToken = res.refreshToken;
    });
    (0, node_test_1.it)('should reject registration with duplicate email', async () => {
        await node_assert_1.default.rejects(async () => {
            await auth_service_1.authService.register({
                email: testEmail,
                password: 'AnotherPassword123!',
                fullName: 'Duplicate Ramesh',
            });
        }, { name: 'ConflictError' });
    });
    (0, node_test_1.it)('should log in with valid credentials', async () => {
        const res = await auth_service_1.authService.login(testEmail, 'SecurePassword123!');
        node_assert_1.default.ok(res.accessToken);
        node_assert_1.default.strictEqual(res.user.email, testEmail);
    });
    (0, node_test_1.it)('should fail login with invalid password', async () => {
        await node_assert_1.default.rejects(async () => {
            await auth_service_1.authService.login(testEmail, 'WrongPassword!');
        }, { name: 'UnauthorizedError' });
    });
    (0, node_test_1.it)('should refresh access token using refresh token', async () => {
        const res = await auth_service_1.authService.refreshTokens(refreshToken);
        node_assert_1.default.ok(res.accessToken);
        node_assert_1.default.ok(res.refreshToken);
        node_assert_1.default.strictEqual(res.user.email, testEmail);
    });
});
