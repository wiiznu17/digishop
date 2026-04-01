import request from 'supertest';
import app from '../app';
import crypto from 'crypto';
import { Order, ShippingInfo, ShipmentEvent, ReturnShipment } from '@digishop/db';
import { carrierService } from '../services/carrierService';
import { returnCarrierService } from '../services/returnCarrierService';

jest.mock('../services/carrierService');
jest.mock('../services/returnCarrierService');

const CARRIER_SECRET = 'test-carrier-secret';
const RETURN_CARRIER_SECRET = 'test-return-secret';

function generateSignature(payload: any, secret: string) {
    const canonical = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');
}

describe('Webhook API (with HMAC)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock DB for middlewares
        (Order.findByPk as jest.Mock).mockResolvedValue({ id: 1, status: 'PAID' });
        (ShippingInfo.findOne as jest.Mock).mockResolvedValue({ id: 1, orderId: 1, shippingStatus: 'PENDING' });
        (ShipmentEvent.findOne as jest.Mock).mockResolvedValue(null);
        (ReturnShipment.findByPk as jest.Mock).mockResolvedValue({ id: 1, orderId: 1, status: 'PENDING' });
        (ReturnShipment.findOne as jest.Mock).mockResolvedValue({ id: 1, orderId: 1, status: 'PENDING' });
    });

    describe('POST /api/merchant/transit/webhooks/carriers/:carrier', () => {
        const payload = { 
            orderId: 1,
            trackingNumber: '123', 
            status: 'DELIVERED',
            occurredAt: new Date().toISOString()
        };

        it('should return 200 on successful carrier webhook with valid signature', async () => {
            (carrierService.processWebhook as jest.Mock).mockResolvedValue({ ok: true });
            const signature = generateSignature(payload, CARRIER_SECRET);

            const res = await request(app)
                .post('/api/merchant/transit/webhooks/carriers/jtexpress')
                .set('x-signature', `sha256=${signature}`)
                .send(payload);

            expect(res.status).toBe(200);
        });

        it('should return 401 for invalid signature', async () => {
            const res = await request(app)
                .post('/api/merchant/transit/webhooks/carriers/jtexpress')
                .set('x-signature', 'sha256=invalid-signature')
                .send(payload);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Bad signature');
        });

        it('should return 400 if orderId is missing (with valid signature)', async () => {
            const invalidPayload = { trackingNumber: '123', status: 'DELIVERED' };
            const signature = generateSignature(invalidPayload, CARRIER_SECRET);

            const res = await request(app)
                .post('/api/merchant/transit/webhooks/carriers/jtexpress')
                .set('x-signature', `sha256=${signature}`)
                .send(invalidPayload);

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/merchant/return-transit/webhooks/returns/:carrier', () => {
        const payload = { 
            orderId: 1,
            trackingNumber: 'R123', 
            status: 'RETURNED_TO_SENDER',
            occurredAt: new Date().toISOString()
        };

        it('should return 200 on successful return carrier webhook with valid signature', async () => {
            (returnCarrierService.processWebhook as jest.Mock).mockResolvedValue({ ok: true });
            const signature = generateSignature(payload, RETURN_CARRIER_SECRET);

            const res = await request(app)
                .post('/api/merchant/return-transit/webhooks/returns/jtexpress')
                .set('x-signature', `sha256=${signature}`)
                .send(payload);

            expect(res.status).toBe(200);
        });

        it('should return 401 for invalid return signature', async () => {
            const res = await request(app)
                .post('/api/merchant/return-transit/webhooks/returns/jtexpress')
                .set('x-signature', 'sha256=invalid-signature')
                .send(payload);

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/merchant/return-transit/returns/:id/fail', () => {
        it('should return 200 on mark return failed success (no HMAC required for internal/fail)', async () => {
            (returnCarrierService.markReturnFailed as jest.Mock).mockResolvedValue({ ok: true });

            const res = await request(app)
                .post('/api/merchant/return-transit/returns/1/fail');

            expect(res.status).toBe(200);
        });
    });
});
