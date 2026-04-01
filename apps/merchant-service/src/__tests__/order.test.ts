import request from 'supertest';
import app from '../app';
import { Store } from '@digishop/db';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { orderService } from '../services/orderService';

jest.mock('../services/orderService');

describe('Order API', () => {
    const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

    beforeEach(() => {
        jest.clearAllMocks();
        (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
        (redis.get as jest.Mock).mockResolvedValue(mockSession);
        (Store.findOne as jest.Mock).mockResolvedValue({ id: 101, status: 'APPROVED' });
    });

    describe('GET /api/merchant/orders', () => {
        it('should return 200 and order list', async () => {
            const mockResult = { data: [{ id: 1, uuid: 'o1' }], meta: { total: 1 } };
            (orderService.getOrderList as jest.Mock).mockResolvedValue(mockResult);

            const res = await request(app)
                .get('/api/merchant/orders')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('GET /api/merchant/orders/summary', () => {
        it('should return 200 and summary', async () => {
            (orderService.getOrdersSummary as jest.Mock).mockResolvedValue({ totalRevenue: 50000 });

            const res = await request(app)
                .get('/api/merchant/orders/summary')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.totalRevenue).toBe(50000);
        });
    });

    describe('GET /api/merchant/orders/:orderId', () => {
        it('should return 200 and order detail', async () => {
            (orderService.getOrderDetail as jest.Mock).mockResolvedValue({ id: 1, uuid: 'o1' });

            const res = await request(app)
                .get('/api/merchant/orders/o1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.uuid).toBe('o1');
        });
    });

    describe('PATCH /api/merchant/orders/:orderId', () => {
        it('should return 200 on update success', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({ id: 1 });

            const res = await request(app)
                .patch('/api/merchant/orders/o1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ status: 'PROCESSING' });

            expect(res.status).toBe(200);
        });
    });
});
