import request from 'supertest';
import app from '../app';
import { paymentService } from '../services/paymentService';

jest.mock('../services/paymentService');

describe('Payment API (Customer)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /customer/payment/callback', () => {
        it('should return 200 and redirect HTML', async () => {
            (paymentService.getCallbackRedirectUrl as jest.Mock).mockResolvedValue({ url: 'http://test.com/order/1' });

            const res = await request(app)
                .post('/customer/payment/callback?reference=txn-123&process_status=true');

            expect(res.status).toBe(200);
            expect(res.text).toContain('location.replace("http://test.com/order/1")');
        });
    });

    describe('POST /customer/payment/notify', () => {
        it('should return 200 on successful notification', async () => {
            (paymentService.handleNotify as jest.Mock).mockResolvedValue({ ok: true });

            const res = await request(app)
                .post('/customer/payment/notify')
                .send({ 
                    reference: 'txn-123',
                    status: 'APPROVED',
                    amount: 100,
                    timestamp: new Date().toISOString()
                });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });
});
