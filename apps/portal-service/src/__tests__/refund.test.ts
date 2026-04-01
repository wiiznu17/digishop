import request from 'supertest';
import app from '../app';
import { refundService } from '../services/refundService';

jest.mock('../services/refundService');

describe('Refund API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── List Refunds ──────────────────────────────────────
    describe('GET /api/admin/refunds/list', () => {
        it('should return 200 and refund list', async () => {
            (refundService.listRefunds as jest.Mock).mockResolvedValue({
                data: [
                    {
                        id: 1,
                        orderId: 100,
                        amount: 5000,
                        status: 'PENDING',
                        reason: 'Product defective'
                    },
                    {
                        id: 2,
                        orderId: 101,
                        amount: 3000,
                        status: 'APPROVED',
                        reason: 'Wrong item'
                    },
                ],
                meta: { total: 2, page: 1, pageSize: 20 }
            });

            const res = await request(app)
                .get('/api/admin/refunds/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.meta.total).toBe(2);
        });

        it('should pass query params to service', async () => {
            (refundService.listRefunds as jest.Mock).mockResolvedValue({
                data: [],
                meta: { total: 0 }
            });

            await request(app)
                .get('/api/admin/refunds/list?page=2&pageSize=10&status=PENDING')
                .set('Cookie', ['access_token=valid-token']);

            expect(refundService.listRefunds).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: '2',
                    pageSize: '10',
                    status: 'PENDING'
                })
            );
        });

        it('should return 500 when service throws', async () => {
            (refundService.listRefunds as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/refunds/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });

        it('should return empty data when no refunds', async () => {
            (refundService.listRefunds as jest.Mock).mockResolvedValue({
                data: [],
                meta: { total: 0, page: 1, pageSize: 20 }
            });

            const res = await request(app)
                .get('/api/admin/refunds/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
            expect(res.body.meta.total).toBe(0);
        });
    });
});
