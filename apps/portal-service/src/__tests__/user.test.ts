import request from 'supertest';
import app from '../app';
import { userService } from '../services/userService';

jest.mock('../services/userService');

describe('User API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/users/list', () => {
        it('should return 200 and user list', async () => {
            (userService.listUsers as jest.Mock).mockResolvedValue({
                data: [{ id: 1, email: 'user@test.com' }],
                meta: { total: 1 }
            });

            const res = await request(app)
                .get('/api/admin/users/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should return 500 when service throws', async () => {
            (userService.listUsers as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/users/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/admin/users/:id/detail', () => {
        it('should return 200 and user detail', async () => {
            (userService.getUserDetail as jest.Mock).mockResolvedValue({
                id: 1,
                email: 'user@test.com'
            });

            const res = await request(app)
                .get('/api/admin/users/1/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe('user@test.com');
        });

        it('should return 500 when service throws', async () => {
            (userService.getUserDetail as jest.Mock).mockRejectedValue(new Error('NOT_FOUND'));

            const res = await request(app)
                .get('/api/admin/users/999/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/admin/users/suggest', () => {
        it('should return 200 and suggestions', async () => {
            (userService.suggestUsers as jest.Mock).mockResolvedValue({
                users: [{ id: 1, email: 'user@test.com' }]
            });

            const res = await request(app)
                .get('/api/admin/users/suggest?q=user')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.users).toHaveLength(1);
        });
    });
});
