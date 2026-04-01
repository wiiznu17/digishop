import request from 'supertest';
import app from '../app';
import { authService } from '../services/authService';
import { adminCredentialService } from '../services/adminCredentialService';

jest.mock('../services/authService');
jest.mock('../services/adminCredentialService');

describe('Auth API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should login and set cookies', async () => {
            (authService.login as jest.Mock).mockResolvedValue({
                access: 'access-jwt',
                refresh: 'refresh-jwt'
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@test.com', password: 'password' });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            const cookies = res.get('Set-Cookie') || [];
            expect(cookies.some((c: string) => c.includes('access_token'))).toBe(true);
        });

        it('should return 500 on invalid credentials', async () => {
            (authService.login as jest.Mock).mockRejectedValue(new Error('INVALID_CREDENTIALS'));

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'bad@test.com', password: 'wrong' });

            expect(res.status).toBe(500);
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should refresh tokens using refresh cookie', async () => {
            (authService.refresh as jest.Mock).mockResolvedValue({
                access: 'new-access-jwt',
                refresh: 'new-refresh-jwt'
            });

            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', ['refresh_token=valid-refresh']);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });

        it('should return 401 if no refresh cookie', async () => {
            const res = await request(app)
                .post('/api/auth/refresh');

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout and clear cookies', async () => {
            (authService.logout as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', ['refresh_token=valid-refresh']);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    describe('GET /api/auth/access', () => {
        it('should return access info for authenticated admin', async () => {
            (authService.getAccessInfo as jest.Mock).mockResolvedValue({
                id: 1,
                email: 'admin@test.com'
            });

            const res = await request(app)
                .get('/api/auth/access')
                .set('Cookie', ['access_token=valid-access']);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe('admin@test.com');
        });
    });

    describe('POST /api/auth/invite/accept', () => {
        it('should accept invite with valid payload', async () => {
            (adminCredentialService.acceptInvite as jest.Mock).mockResolvedValue({
                ok: true,
                message: 'Invite accepted'
            });

            const res = await request(app)
                .post('/api/auth/invite/accept')
                .send({ token: 'valid-invite-token', password: 'NewPass123!', name: 'Admin' });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    describe('POST /api/auth/password/reset/confirm', () => {
        it('should confirm password reset', async () => {
            (adminCredentialService.performReset as jest.Mock).mockResolvedValue({
                ok: true,
                message: 'Password reset'
            });

            const res = await request(app)
                .post('/api/auth/password/reset/confirm')
                .send({ token: 'reset-token', password: 'NewPass123!' });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });
});
