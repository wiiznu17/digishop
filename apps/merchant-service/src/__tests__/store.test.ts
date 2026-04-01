import request from 'supertest';
import app from '../app';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { storeService } from '../services/storeService';

jest.mock('../services/storeService');

describe('Store API', () => {
    const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

    beforeEach(() => {
        jest.clearAllMocks();
        (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
        (redis.get as jest.Mock).mockResolvedValue(mockSession);
    });

    describe('GET /api/merchant/store/status', () => {
        it('should return 200 and status', async () => {
            (storeService.getStoreStatus as jest.Mock).mockResolvedValue({ status: 'APPROVED' });

            const res = await request(app)
                .get('/api/merchant/store/status')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('APPROVED');
        });
    });
});
