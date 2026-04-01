import request from 'supertest';
import app from '../app';
import { analyticsService } from '../services/analyticsService';

jest.mock('../services/analyticsService');

describe('Analytics API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/analytics/kpis', () => {
        it('should return 200 and kpis', async () => {
            (analyticsService.getKpis as jest.Mock).mockResolvedValue({
                totalRevenue: 1000000,
                totalOrders: 500
            });

            const res = await request(app)
                .get('/api/admin/analytics/kpis')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.totalRevenue).toBe(1000000);
        });

        it('should return 500 when service throws', async () => {
            (analyticsService.getKpis as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/analytics/kpis')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/admin/analytics/trends', () => {
        it('should return 200 and trends', async () => {
            (analyticsService.getTrends as jest.Mock).mockResolvedValue([
                { date: '2023-01-01', value: 100 }
            ]);

            const res = await request(app)
                .get('/api/admin/analytics/trends')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('GET /api/admin/analytics/status-dist', () => {
        it('should return 200 and distribution', async () => {
            (analyticsService.getStatusDist as jest.Mock).mockResolvedValue([
                { status: 'PAID', count: 50 }
            ]);

            const res = await request(app)
                .get('/api/admin/analytics/status-dist')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('GET /api/admin/analytics/stores', () => {
        it('should return 200 and leaderboard', async () => {
            (analyticsService.getStoreLeaderboard as jest.Mock).mockResolvedValue([
                { storeName: 'Store A', totalSales: 50000 }
            ]);

            const res = await request(app)
                .get('/api/admin/analytics/stores')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body[0].storeName).toBe('Store A');
        });
    });
});
