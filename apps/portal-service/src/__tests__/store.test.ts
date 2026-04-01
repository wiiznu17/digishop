import request from 'supertest';
import app from '../app';
import { storeService } from '../services/storeService';

jest.mock('../services/storeService');

describe('Store API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/stores/list', () => {
        it('should return 200 and store list', async () => {
            (storeService.listStores as jest.Mock).mockResolvedValue({
                data: [{ id: 1, storeName: 'Test Store' }],
                meta: { total: 1 }
            });

            const res = await request(app)
                .get('/api/admin/stores/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should return 500 when service throws', async () => {
            (storeService.listStores as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/stores/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/admin/stores/:id/detail', () => {
        it('should return 200 and store detail', async () => {
            (storeService.getStoreDetail as jest.Mock).mockResolvedValue({
                id: 1,
                storeName: 'Test Store'
            });

            const res = await request(app)
                .get('/api/admin/stores/1/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.storeName).toBe('Test Store');
        });
    });

    describe('POST /api/admin/stores/:id/approve', () => {
        it('should return 200 on approval success', async () => {
            (storeService.approveStore as jest.Mock).mockResolvedValue({
                id: 1,
                status: 'APPROVED'
            });

            const res = await request(app)
                .post('/api/admin/stores/1/approve')
                .set('Cookie', ['access_token=valid-token'])
                .send({ status: 'APPROVED', reason: 'Verified' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('APPROVED');
        });
    });

    describe('GET /api/admin/stores/suggest', () => {
        it('should return 200 and suggestions', async () => {
            (storeService.suggestStores as jest.Mock).mockResolvedValue({
                stores: [{ id: 1, storeName: 'Store A' }]
            });

            const res = await request(app)
                .get('/api/admin/stores/suggest?q=store')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.stores).toHaveLength(1);
        });
    });
});
