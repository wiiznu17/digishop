import request from 'supertest';
import app from '../app';
import { orderService } from '../services/orderService';

jest.mock('../services/orderService');

describe('Order API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/orders/list', () => {
        it('should return 200 and order list', async () => {
            (orderService.listOrders as jest.Mock).mockResolvedValue({
                data: [{ uuid: 'o1', totalAmount: 100 }],
                meta: { total: 1 }
            });

            const res = await request(app)
                .get('/api/admin/orders/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should return 500 when service throws', async () => {
            (orderService.listOrders as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/orders/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/admin/orders/:id/detail', () => {
        it('should return 200 and order detail', async () => {
            (orderService.getOrderDetail as jest.Mock).mockResolvedValue({
                uuid: 'o1',
                status: 'PAID'
            });

            const res = await request(app)
                .get('/api/admin/orders/1/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.uuid).toBe('o1');
        });
    });

    describe('GET /api/admin/orders/suggest', () => {
        it('should return 200 and suggestions', async () => {
            (orderService.suggestOrders as jest.Mock).mockResolvedValue({
                orders: [{ uuid: 'o1' }]
            });

            const res = await request(app)
                .get('/api/admin/orders/suggest?q=test')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.orders).toHaveLength(1);
        });
    });

    describe('GET /api/admin/orders/customer-suggest', () => {
        it('should return 200 and customer suggestions', async () => {
            (orderService.suggestCustomerEmails as jest.Mock).mockResolvedValue({
                emails: ['test@user.com']
            });

            const res = await request(app)
                .get('/api/admin/orders/customer-suggest?q=te')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.emails).toContain('test@user.com');
        });
    });

    describe('GET /api/admin/orders/store-name-suggest', () => {
        it('should return 200 and store name suggestions', async () => {
            (orderService.suggestStoreName as jest.Mock).mockResolvedValue({
                stores: ['Store A', 'Store B']
            });

            const res = await request(app)
                .get('/api/admin/orders/store-name-suggest?q=st')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.stores).toHaveLength(2);
        });
    });
});
