import request from 'supertest';
import app from '../app';
import { categoryService } from '../services/categoryService';

jest.mock('../services/categoryService');

describe('Category API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/categories/list', () => {
        it('should return 200 and category list', async () => {
            (categoryService.listCategories as jest.Mock).mockResolvedValue({
                data: [{ uuid: 'c1', name: 'Cat 1' }],
                meta: { total: 1 }
            });

            const res = await request(app)
                .get('/api/admin/categories/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should return 500 when service throws', async () => {
            (categoryService.listCategories as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/categories/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/admin/categories/suggest', () => {
        it('should return 200 and category suggestions', async () => {
            (categoryService.suggestCategories as jest.Mock).mockResolvedValue({
                categories: [{ uuid: 'c1', name: 'Cat 1' }]
            });

            const res = await request(app)
                .get('/api/admin/categories/suggest?q=cat')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.categories).toHaveLength(1);
        });
    });

    describe('GET /api/admin/categories/:uuid', () => {
        it('should return 200 and category detail', async () => {
            (categoryService.getCategoryDetail as jest.Mock).mockResolvedValue({
                uuid: 'c1',
                name: 'Cat 1',
                productCount: 10
            });

            const res = await request(app)
                .get('/api/admin/categories/c1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.uuid).toBe('c1');
        });
    });

    describe('POST /api/admin/categories', () => {
        it('should return 201 on success', async () => {
            (categoryService.createCategory as jest.Mock).mockResolvedValue({
                uuid: 'c2',
                name: 'New Cat'
            });

            const res = await request(app)
                .post('/api/admin/categories')
                .set('Cookie', ['access_token=valid-token'])
                .send({ name: 'New Cat', slug: 'new-cat' });

            expect(res.status).toBe(201);
            expect(res.body.uuid).toBe('c2');
        });
    });

    describe('PATCH /api/admin/categories/:uuid', () => {
        it('should return 200 on update success', async () => {
            (categoryService.updateCategory as jest.Mock).mockResolvedValue({
                uuid: 'c1',
                name: 'Updated Cat'
            });

            const res = await request(app)
                .patch('/api/admin/categories/c1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ name: 'Updated Cat' });

            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /api/admin/categories/:uuid', () => {
        it('should return 200 on delete success', async () => {
            (categoryService.deleteCategory as jest.Mock).mockResolvedValue({
                ok: true
            });

            const res = await request(app)
                .delete('/api/admin/categories/c1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
        });

        it('should return 409 when category has products', async () => {
            (categoryService.deleteCategory as jest.Mock).mockRejectedValue(
                new Error('CATEGORY_HAS_PRODUCTS')
            );

            const res = await request(app)
                .delete('/api/admin/categories/c1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('CATEGORY_HAS_PRODUCTS');
        });
    });

    describe('POST /api/admin/categories/:uuid/move-products', () => {
        it('should return 200 on move success', async () => {
            (categoryService.moveProducts as jest.Mock).mockResolvedValue({
                moved: 3
            });

            const res = await request(app)
                .post('/api/admin/categories/c1/move-products')
                .set('Cookie', ['access_token=valid-token'])
                .send({ targetCategoryUuid: 'c2' });

            expect(res.status).toBe(200);
        });
    });
});
