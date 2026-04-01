import request from 'supertest';
import app from '../app';
import { productService } from '../services/productService';

jest.mock('../services/productService');

describe('Product API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/products/list', () => {
        it('should return 200 and product list', async () => {
            (productService.listProducts as jest.Mock).mockResolvedValue({
                data: [{ uuid: 'p1', name: 'Product 1' }],
                meta: { total: 1 }
            });

            const res = await request(app)
                .get('/api/admin/products/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should return 500 when service throws', async () => {
            (productService.listProducts as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/products/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/admin/products/:uuid', () => {
        it('should return 200 and product detail', async () => {
            (productService.getProductDetail as jest.Mock).mockResolvedValue({
                uuid: 'p1',
                name: 'Product 1'
            });

            const res = await request(app)
                .get('/api/admin/products/p1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.uuid).toBe('p1');
        });
    });

    describe('PATCH /api/admin/products/:uuid/moderate', () => {
        it('should return 200 on success', async () => {
            (productService.moderateProduct as jest.Mock).mockResolvedValue({
                uuid: 'p1',
                status: 'PUBLISHED'
            });

            const res = await request(app)
                .patch('/api/admin/products/p1/moderate')
                .set('Cookie', ['access_token=valid-token'])
                .send({ reqStatus: 'PUBLISHED', rejectReason: '' });

            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/admin/products/bulk/moderate', () => {
        it('should return 200 on bulk success', async () => {
            (productService.bulkModerateProducts as jest.Mock).mockResolvedValue({
                updated: 5
            });

            const res = await request(app)
                .post('/api/admin/products/bulk/moderate')
                .set('Cookie', ['access_token=valid-token'])
                .send({ productUuids: ['p1', 'p2'], reqStatus: 'REJECTED', rejectReason: 'Policy violation' });

            expect(res.status).toBe(200);
            expect(res.body.updated).toBe(5);
        });
    });

    describe('GET /api/admin/products/suggest', () => {
        it('should return 200 and suggestions', async () => {
            (productService.suggestProducts as jest.Mock).mockResolvedValue({
                products: [{ uuid: 'p1', name: 'Suggested' }]
            });

            const res = await request(app)
                .get('/api/admin/products/suggest?q=test')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.products).toHaveLength(1);
        });
    });
});
