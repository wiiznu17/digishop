import request from 'supertest';
import app from '../app';
import { dashboardService } from '../services/dashboardService';

jest.mock('../services/dashboardService');

describe('Dashboard API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── KPIs ──────────────────────────────────────────────
    describe('GET /api/admin/dashboards/kpis', () => {
        it('should return 200 and dashboard kpis', async () => {
            (dashboardService.getDashboardKpis as jest.Mock).mockResolvedValue({
                totalOrders: 1200,
                totalRevenue: 5000000,
                totalCustomers: 300,
                totalStores: 50
            });

            const res = await request(app)
                .get('/api/admin/dashboards/kpis')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.totalOrders).toBe(1200);
            expect(res.body.totalRevenue).toBe(5000000);
        });

        it('should forward query params', async () => {
            (dashboardService.getDashboardKpis as jest.Mock).mockResolvedValue({});

            await request(app)
                .get('/api/admin/dashboards/kpis?period=monthly&from=2023-01-01')
                .set('Cookie', ['access_token=valid-token']);

            expect(dashboardService.getDashboardKpis).toHaveBeenCalledWith(
                expect.objectContaining({
                    period: 'monthly',
                    from: '2023-01-01'
                })
            );
        });

        it('should return 500 when service throws', async () => {
            (dashboardService.getDashboardKpis as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/dashboards/kpis')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ── Series ────────────────────────────────────────────
    describe('GET /api/admin/dashboards/series', () => {
        it('should return 200 and series data', async () => {
            (dashboardService.getDashboardSeries as jest.Mock).mockResolvedValue([
                { date: '2023-01-01', orders: 10, revenue: 50000 },
                { date: '2023-01-02', orders: 15, revenue: 75000 },
            ]);

            const res = await request(app)
                .get('/api/admin/dashboards/series')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
        });
    });

    // ── Status Distribution ───────────────────────────────
    describe('GET /api/admin/dashboards/status-dist', () => {
        it('should return 200 and status distribution', async () => {
            (dashboardService.getDashboardStatusDist as jest.Mock).mockResolvedValue([
                { status: 'PAID', count: 50 },
                { status: 'SHIPPED', count: 30 },
                { status: 'DELIVERED', count: 20 },
            ]);

            const res = await request(app)
                .get('/api/admin/dashboards/status-dist')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(3);
            expect(res.body[0].status).toBe('PAID');
        });
    });

    // ── Top Stores ────────────────────────────────────────
    describe('GET /api/admin/dashboards/top-stores', () => {
        it('should return 200 and top stores', async () => {
            (dashboardService.getDashboardTopStores as jest.Mock).mockResolvedValue([
                { storeName: 'Store Alpha', totalSales: 100000, orderCount: 50 },
                { storeName: 'Store Beta', totalSales: 80000, orderCount: 40 },
            ]);

            const res = await request(app)
                .get('/api/admin/dashboards/top-stores')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].storeName).toBe('Store Alpha');
        });
    });
});
