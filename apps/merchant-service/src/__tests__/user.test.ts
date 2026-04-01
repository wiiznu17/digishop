import request from 'supertest';
import app from '../app';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { userService } from '../services/userService';

jest.mock('../services/userService');

describe('User API', () => {
    const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

    beforeEach(() => {
        jest.clearAllMocks();
        (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
        (redis.get as jest.Mock).mockResolvedValue(mockSession);
    });

    describe('GET /api/merchant/profile', () => {
        it('should return 200 and profile', async () => {
            (userService.getMerchantProfile as jest.Mock).mockResolvedValue({ id: 1, email: 'test@merchant.com' });

            const res = await request(app)
                .get('/api/merchant/profile')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe('test@merchant.com');
        });
    });

    describe('POST /api/merchant/register', () => {
        it('should return 201 on success', async () => {
            (userService.createStoreForUser as jest.Mock).mockResolvedValue({ id: 1, storeName: 'New Store' });

            const res = await request(app)
                .post('/api/merchant/register')
                .send({ 
                    userId: 1,
                    storeName: 'New Store', 
                    ownerName: 'Owner',
                    email: 'test@store.com',
                    phone: '0812345678',
                    businessType: 'Retail',
                    addressNumber: '1',
                    addressStreet: 'Main St',
                    addressSubdistrict: 'Sub',
                    addressDistrict: 'Dist',
                    addressProvince: 'Prov',
                    addressZip: '10110'
                });

            expect(res.status).toBe(201);
        });
    });

    describe('PUT /api/merchant/profile', () => {
        it('should return 200 on update success', async () => {
            (userService.updateMerchantProfile as jest.Mock).mockResolvedValue({ id: 1 });

            const res = await request(app)
                .put('/api/merchant/profile')
                .set('Cookie', ['access_token=valid-token'])
                .send({ firstName: 'Updated' });

            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /api/merchant/:id', () => {
        it('should return 204 on delete success', async () => {
            (userService.deleteUser as jest.Mock).mockResolvedValue(true);

            const res = await request(app)
                .delete('/api/merchant/1');

            expect(res.status).toBe(204);
        });
    });

    describe('PUT /api/merchant/profile/address/:id', () => {
        it('should return 200 on address update success', async () => {
            (userService.updateMerchantAddress as jest.Mock).mockResolvedValue({ id: 1 });

            const res = await request(app)
                .put('/api/merchant/profile/address/1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ province: 'Bangkok' });

            expect(res.status).toBe(200);
        });
    });
});
