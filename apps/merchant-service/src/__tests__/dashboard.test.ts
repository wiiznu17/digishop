import request from 'supertest';
import app from '../app';
import { Store } from '@digishop/db';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { dashboardService } from '../services/dashboardService';

jest.mock('../services/dashboardService');

describe('Dashboard API', () => {
    const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

    beforeEach(() => {
        jest.clearAllMocks();
        (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
        (redis.get as jest.Mock).mockResolvedValue(mockSession);
        (Store.findOne as jest.Mock).mockResolvedValue({ id: 101, status: 'APPROVED' });
    });

    describe('GET /api/merchant/dashboard', () => {
        it('should return 200 and dashboard summary', async () => {
            (dashboardService.getDashboardSummary as jest.Mock).mockResolvedValue({ totalSales: 100 });

            const res = await request(app)
                .get('/api/merchant/dashboard')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.totalSales).toBe(100);
        });
    });
});
