import request from 'supertest';
import app from '../app';
import { Order, ShippingInfo, ShipmentEvent, ReturnShipment } from '@digishop/db';
import { carrierService } from '../services/carrierService';
import { returnCarrierService } from '../services/returnCarrierService';

jest.mock('../services/carrierService');
jest.mock('../services/returnCarrierService');

describe('Webhook API', () => {
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
        it('should return 200 on successful carrier webhook', async () => {
            (carrierService.processWebhook as jest.Mock).mockResolvedValue({ ok: true });

            const res = await request(app)
                .post('/api/merchant/transit/webhooks/carriers/jtexpress')
                .send({ 
                    orderId: 1,
                    trackingNumber: '123', 
                    status: 'DELIVERED',
                    occurredAt: new Date().toISOString()
                });

            expect(res.status).toBe(200);
        });

        it('should return 400 if orderId is missing', async () => {
            const res = await request(app)
                .post('/api/merchant/transit/webhooks/carriers/jtexpress')
                .send({ trackingNumber: '123', status: 'DELIVERED' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/merchant/return-transit/webhooks/returns/:carrier', () => {
        it('should return 200 on successful return carrier webhook', async () => {
            (returnCarrierService.processWebhook as jest.Mock).mockResolvedValue({ ok: true });

            const res = await request(app)
                .post('/api/merchant/return-transit/webhooks/returns/jtexpress')
                .send({ 
                    orderId: 1,
                    trackingNumber: 'R123', 
                    status: 'RETURNED_TO_SENDER',
                    occurredAt: new Date().toISOString()
                });

            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/merchant/return-transit/returns/:id/fail', () => {
        it('should return 200 on mark return failed success', async () => {
            (returnCarrierService.markReturnFailed as jest.Mock).mockResolvedValue({ ok: true });

            const res = await request(app)
                .post('/api/merchant/return-transit/returns/1/fail');

            expect(res.status).toBe(200);
        });
    });
});
