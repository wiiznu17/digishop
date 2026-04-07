import request from 'supertest';
import app from '../app';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { storeService } from '../services/storeService';
import { Store, StoreStatus } from '@digishop/db';

jest.mock('../services/storeService');

describe('Store API', () => {
    const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

    beforeEach(() => {
        jest.clearAllMocks();
        (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
        (redis.get as jest.Mock).mockResolvedValue(mockSession);
        // Default: approved store
        (Store.findOne as jest.Mock).mockResolvedValue({ 
            id: 101, 
            status: StoreStatus.APPROVED,
            get: (key: string) => key === 'status' ? StoreStatus.APPROVED : undefined 
        });
    });

    describe('GET /api/merchant/store/status', () => {
        it('should return 200 and status', async () => {
            (storeService.getStoreStatus as jest.Mock).mockResolvedValue({ status: 'APPROVED' });

            const res = await request(app)
                .get('/api/merchant/store/status')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('APPROVED');
        });
    });

    describe('BANNED Store Restriction', () => {
        beforeEach(() => {
            // Mock Store.findOne to return a banned store object that behaves like a Sequelize model
            (Store.findOne as jest.Mock).mockResolvedValue({ 
                id: 101, 
                status: StoreStatus.BANNED,
                get: (key: string) => key === 'status' ? StoreStatus.BANNED : undefined 
            });
        });

        it('should return 403 STORE_BANNED when store is BANNED (via requireApprovedStore)', async () => {
            const res = await request(app)
                .get('/api/merchant/products/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('STORE_BANNED');
        });

        it('should return 403 STORE_BANNED when store is BANNED (via attachStore)', async () => {
            // Here we test an endpoint that goes through requireApprovedStore and attachStore
            // They should both return 403 STORE_BANNED if the store is banned.
            const res = await request(app)
                .get('/api/merchant/dashboard/')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('STORE_BANNED');
        });
    });
});
