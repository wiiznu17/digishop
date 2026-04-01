import request from 'supertest';
import app from '../app';
import { Store } from '@digishop/db';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { bankService } from '../services/bankService';

jest.mock('../services/bankService');

describe('Bank API', () => {
    const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

    beforeEach(() => {
        jest.clearAllMocks();
        (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
        (redis.get as jest.Mock).mockResolvedValue(mockSession);
        (Store.findOne as jest.Mock).mockResolvedValue({ id: 101, status: 'APPROVED' });
    });

    describe('GET /api/merchant/bank-accounts/bank-list', () => {
        it('should return 200 and bank account list', async () => {
            (bankService.getBankAccountList as jest.Mock).mockResolvedValue([{ id: 1, bankName: 'Bank A' }]);

            const res = await request(app)
                .get('/api/merchant/bank-accounts/bank-list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe('POST /api/merchant/bank-accounts/create', () => {
        it('should return 201 on success', async () => {
            (bankService.addBankAccountToStore as jest.Mock).mockResolvedValue({ id: 1 });

            const res = await request(app)
                .post('/api/merchant/bank-accounts/create')
                .set('Cookie', ['access_token=valid-token'])
                .send({
                    bankName: 'Bank A',
                    accountNumber: '1234567890',
                    accountName: 'Merchant Name'
                });

            expect(res.status).toBe(201);
        });
    });

    describe('PATCH /api/merchant/bank-accounts/set-default/:id', () => {
        it('should return 200 on success', async () => {
            (bankService.setDefaultBankAccount as jest.Mock).mockResolvedValue({ id: 1, isDefault: true });

            const res = await request(app)
                .patch('/api/merchant/bank-accounts/set-default/1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /api/merchant/bank-accounts/:id', () => {
        it('should return 204 on delete success', async () => {
            (bankService.deleteBankAccount as jest.Mock).mockResolvedValue(true);

            const res = await request(app)
                .delete('/api/merchant/bank-accounts/1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(204);
        });
    });
});
