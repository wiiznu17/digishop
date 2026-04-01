import request from 'supertest';
import app from '../app';
import { orderService } from '../services/orderService';

jest.mock('../services/orderService');

describe('Order API (Customer)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /customer/order/create', () => {
        it('should return 200 on successful order creation', async () => {
            (orderService.createOrder as jest.Mock).mockResolvedValue({ data: { id: 1 } });

            const res = await request(app)
                .post('/customer/order/create')
                .set('Cookie', ['access_token=valid-token'])
                .send({
                    orderCode: 'DGS123',
                    customerId: '1',
                    paymentMethod: 'CREDIT_CARD',
                    shippingTypeId: 1,
                    shippingAddress: {},
                    productprice: 1000,
                    shippingfee: 50
                });

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(1);
        });
    });

    describe('GET /customer/order/user/id/:id', () => {
        it('should return 200 and user orders', async () => {
            (orderService.findUserOrder as jest.Mock).mockResolvedValue({
                body: [{ id: 1, status: 'PENDING' }],
                count: 1
            });

            const res = await request(app)
                .get('/customer/order/user/id/1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.body).toHaveLength(1);
        });
    });

    describe('GET /customer/order/cart/user/:id', () => {
        it('should return 200 and user cart', async () => {
            (orderService.findUserCart as jest.Mock).mockResolvedValue({
                data: [{ id: 1, productId: 1, quantity: 1 }],
                count: 1
            });

            const res = await request(app)
                .get('/customer/order/cart/user/1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('PATCH /customer/order/cancel/:id', () => {
        it('should return 200 on successful cancellation', async () => {
            (orderService.cancelOrder as jest.Mock).mockResolvedValue({ data: 'success' });

            const res = await request(app)
                .patch('/customer/order/cancel/1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toBe('success');
        });
    });

    describe('GET /customer/order/shiptype', () => {
        it('should return 200 and shipping types', async () => {
            (orderService.findShipping as jest.Mock).mockResolvedValue({
                data: [{ id: 1, name: 'Standard' }]
            });

            const res = await request(app)
                .get('/customer/order/shiptype')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });
});
