import request from 'supertest';
import app from '../app';
import { Store } from '@digishop/db';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { productService } from '../services/productService';
import { AppError } from '../errors/AppError';

jest.mock('../services/productService', () => ({
    productService: {
        getProductList: jest.fn(),
        getProductDetail: jest.fn(),
        duplicateProduct: jest.fn(),
        bulkUpdateProductStatus: jest.fn(),
        bulkDeleteProducts: jest.fn(),
        deleteProduct: jest.fn(),
        suggestProducts: jest.fn(),
        listCategories: jest.fn(),
        applyDesiredState: jest.fn(),
        updateProductItem: jest.fn(),
    }
}));

jest.mock('../repositories/productRepository');

// ─── Helpers ────────────────────────────────────────────────────
const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

function setupAuth() {
    (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
    (redis.get as jest.Mock).mockResolvedValue(mockSession);
    (Store.findOne as jest.Mock).mockResolvedValue({ id: 101, status: 'APPROVED' });
}

function makeError(statusCode: number, message: string) {
    return new AppError(message, statusCode, true, { error: message });
}

// ═══════════════════════════════════════════════════════════════
//  API-Level Tests (Routes + Controller)
// ═══════════════════════════════════════════════════════════════
describe('Product API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAuth();
    });

    // ─── GET /api/merchant/products/list ────────────────────
    describe('GET /api/merchant/products/list', () => {
        it('should return 200 and product list', async () => {
            const mockResult = { data: [{ uuid: 'p1', name: 'Product 1' }], meta: { total: 1 } };
            (productService.getProductList as jest.Mock).mockResolvedValue(mockResult);

            const res = await request(app)
                .get('/api/merchant/products/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should pass query params to service', async () => {
            (productService.getProductList as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });

            await request(app)
                .get('/api/merchant/products/list?q=shirt&status=ACTIVE&page=2&pageSize=10')
                .set('Cookie', ['access_token=valid-token']);

            expect(productService.getProductList).toHaveBeenCalledWith(
                101,
                expect.objectContaining({ q: 'shirt', status: 'ACTIVE', page: '2', pageSize: '10' })
            );
        });

        it('should return empty list when no products', async () => {
            (productService.getProductList as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });

            const res = await request(app)
                .get('/api/merchant/products/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
        });

        it('should return 401 when not authenticated', async () => {
            (verifyAccess as jest.Mock).mockImplementation(() => { throw new Error('invalid token'); });

            const res = await request(app).get('/api/merchant/products/list');
            expect(res.status).toBe(401);
        });

        it('should return 500 when service throws', async () => {
            (productService.getProductList as jest.Mock).mockRejectedValue(new Error('DB error'));

            const res = await request(app)
                .get('/api/merchant/products/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ─── GET /api/merchant/products/suggest ─────────────────
    describe('GET /api/merchant/products/suggest', () => {
        it('should return 200 and suggestions', async () => {
            (productService.suggestProducts as jest.Mock).mockResolvedValue({ products: [], skus: [] });

            const res = await request(app)
                .get('/api/merchant/products/suggest?q=test')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
        });

        it('should pass query string to service', async () => {
            (productService.suggestProducts as jest.Mock).mockResolvedValue({ products: [], skus: [] });

            await request(app)
                .get('/api/merchant/products/suggest?q=blue+shirt')
                .set('Cookie', ['access_token=valid-token']);

            expect(productService.suggestProducts).toHaveBeenCalledWith(101, 'blue shirt');
        });

        it('should return products and skus in response', async () => {
            (productService.suggestProducts as jest.Mock).mockResolvedValue({
                products: [{ uuid: 'p1', name: 'Blue Shirt', imageUrl: null, categoryName: 'Clothing' }],
                skus: [{ sku: 'SHIRT-001', productUuid: 'p1', productName: 'Blue Shirt', imageUrl: null }]
            });

            const res = await request(app)
                .get('/api/merchant/products/suggest?q=shirt')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.products).toHaveLength(1);
            expect(res.body.skus).toHaveLength(1);
        });
    });

    // ─── GET /api/merchant/products/categories/list ─────────
    describe('GET /api/merchant/products/categories/list', () => {
        it('should return 200 and categories (flat)', async () => {
            (productService.listCategories as jest.Mock).mockResolvedValue([
                { uuid: 'c1', name: 'Electronics', parentUuid: null },
                { uuid: 'c2', name: 'Phones', parentUuid: 'c1' }
            ]);

            const res = await request(app)
                .get('/api/merchant/products/categories/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });

        it('should pass flat param to service', async () => {
            (productService.listCategories as jest.Mock).mockResolvedValue([]);

            await request(app)
                .get('/api/merchant/products/categories/list?flat=false')
                .set('Cookie', ['access_token=valid-token']);

            expect(productService.listCategories).toHaveBeenCalledWith('false');
        });
    });

    // ─── GET /api/merchant/products/:uuid ───────────────────
    describe('GET /api/merchant/products/:productUuid', () => {
        it('should return 200 and product detail', async () => {
            (productService.getProductDetail as jest.Mock).mockResolvedValue({ uuid: 'p1', name: 'Product 1' });

            const res = await request(app)
                .get('/api/merchant/products/p1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.uuid).toBe('p1');
        });

        it('should return 404 when product not found', async () => {
            (productService.getProductDetail as jest.Mock).mockRejectedValue(
                makeError(404, 'Product not found')
            );

            const res = await request(app)
                .get('/api/merchant/products/nonexistent')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(404);
        });

        it('should call service with storeId and productUuid', async () => {
            (productService.getProductDetail as jest.Mock).mockResolvedValue({ uuid: 'p1' });

            await request(app)
                .get('/api/merchant/products/p1')
                .set('Cookie', ['access_token=valid-token']);

            expect(productService.getProductDetail).toHaveBeenCalledWith(101, 'p1');
        });
    });

    // ─── DELETE /api/merchant/products/:uuid ────────────────
    describe('DELETE /api/merchant/products/:productUuid', () => {
        it('should return 204 on success', async () => {
            (productService.deleteProduct as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .delete('/api/merchant/products/p1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(204);
        });

        it('should return 404 when product not found', async () => {
            (productService.deleteProduct as jest.Mock).mockRejectedValue(
                makeError(404, 'Product not found')
            );

            const res = await request(app)
                .delete('/api/merchant/products/nonexistent')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(404);
        });

        it('should call service with correct storeId and productUuid', async () => {
            (productService.deleteProduct as jest.Mock).mockResolvedValue(undefined);

            await request(app)
                .delete('/api/merchant/products/p1')
                .set('Cookie', ['access_token=valid-token']);

            expect(productService.deleteProduct).toHaveBeenCalledWith(101, 'p1');
        });

        it('should return 500 on unexpected error', async () => {
            (productService.deleteProduct as jest.Mock).mockRejectedValue(new Error('DB error'));

            const res = await request(app)
                .delete('/api/merchant/products/p1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ─── POST /api/merchant/products/:uuid/duplicate ────────
    describe('POST /api/merchant/products/:productUuid/duplicate', () => {
        it('should return 201 and duplicated product', async () => {
            (productService.duplicateProduct as jest.Mock).mockResolvedValue({ uuid: 'p2', name: 'Product 1 (Copy)' });

            const res = await request(app)
                .post('/api/merchant/products/p1/duplicate')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(201);
            expect(res.body.uuid).toBe('p2');
        });

        it('should return 404 when source product not found', async () => {
            (productService.duplicateProduct as jest.Mock).mockRejectedValue(
                makeError(404, 'Product not found')
            );

            const res = await request(app)
                .post('/api/merchant/products/nonexistent/duplicate')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(404);
        });

        it('should call service with correct args', async () => {
            (productService.duplicateProduct as jest.Mock).mockResolvedValue({ uuid: 'p2', name: 'Copy' });

            await request(app)
                .post('/api/merchant/products/p1/duplicate')
                .set('Cookie', ['access_token=valid-token']);

            expect(productService.duplicateProduct).toHaveBeenCalledWith(101, 'p1');
        });
    });

    // ─── PATCH /api/merchant/products/bulk/status ───────────
    describe('PATCH /api/merchant/products/bulk/status', () => {
        it('should return 200 when bulk update success', async () => {
            (productService.bulkUpdateProductStatus as jest.Mock).mockResolvedValue({ updated: 2 });

            const res = await request(app)
                .patch('/api/merchant/products/bulk/status')
                .set('Cookie', ['access_token=valid-token'])
                .send({ productUuids: ['p1', 'p2'], status: 'ACTIVE' });

            expect(res.status).toBe(200);
            expect(res.body.updated).toBe(2);
        });

        it('should return 400 when productUuids is empty', async () => {
            const res = await request(app)
                .patch('/api/merchant/products/bulk/status')
                .set('Cookie', ['access_token=valid-token'])
                .send({ productUuids: [], status: 'ACTIVE' });

            expect(res.status).toBe(400);
        });

        it('should return 400 when status is invalid', async () => {
            const res = await request(app)
                .patch('/api/merchant/products/bulk/status')
                .set('Cookie', ['access_token=valid-token'])
                .send({ productUuids: ['p1'], status: 'INVALID_STATUS' });

            expect(res.status).toBe(400);
        });

        it('should return 400 when productUuids missing', async () => {
            const res = await request(app)
                .patch('/api/merchant/products/bulk/status')
                .set('Cookie', ['access_token=valid-token'])
                .send({ status: 'ACTIVE' });

            expect(res.status).toBe(400);
        });

        it('should pass correct args to service', async () => {
            (productService.bulkUpdateProductStatus as jest.Mock).mockResolvedValue({ updated: 1 });

            await request(app)
                .patch('/api/merchant/products/bulk/status')
                .set('Cookie', ['access_token=valid-token'])
                .send({ productUuids: ['p1'], status: 'ACTIVE' });

            expect(productService.bulkUpdateProductStatus).toHaveBeenCalledWith(101, ['p1'], 'ACTIVE');
        });
    });

    // ─── DELETE /api/merchant/products/bulk/delete ──────────
    describe('DELETE /api/merchant/products/bulk/delete', () => {
        it('should return 204 on success', async () => {
            (productService.bulkDeleteProducts as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .delete('/api/merchant/products/bulk/delete')
                .set('Cookie', ['access_token=valid-token'])
                .send({ productUuids: ['p1', 'p2'] });

            expect(res.status).toBe(204);
        });

        it('should return 400 when productUuids is empty', async () => {
            const res = await request(app)
                .delete('/api/merchant/products/bulk/delete')
                .set('Cookie', ['access_token=valid-token'])
                .send({ productUuids: [] });

            expect(res.status).toBe(400);
        });

        it('should return 400 when productUuids missing', async () => {
            const res = await request(app)
                .delete('/api/merchant/products/bulk/delete')
                .set('Cookie', ['access_token=valid-token'])
                .send({});

            expect(res.status).toBe(400);
        });

        it('should call service with storeId and uuids', async () => {
            (productService.bulkDeleteProducts as jest.Mock).mockResolvedValue(undefined);

            await request(app)
                .delete('/api/merchant/products/bulk/delete')
                .set('Cookie', ['access_token=valid-token'])
                .send({ productUuids: ['p1', 'p2'] });

            expect(productService.bulkDeleteProducts).toHaveBeenCalledWith(101, ['p1', 'p2']);
        });
    });

    // ─── POST /api/merchant/products/desired ────────────────
    describe('POST /api/merchant/products/desired (create)', () => {
        it('should return 201 on success', async () => {
            (productService.applyDesiredState as jest.Mock).mockResolvedValue({
                statusCode: 201,
                data: { uuid: 'new-p', name: 'New Product' }
            });

            const res = await request(app)
                .post('/api/merchant/products/desired')
                .set('Cookie', ['access_token=valid-token'])
                .send({ product: { name: 'New' }, variations: [], items: [], images: { product: [] } });

            expect(res.status).toBe(201);
            expect(res.body.uuid).toBe('new-p');
        });

        it('should return 400 when desired payload missing', async () => {
            (productService.applyDesiredState as jest.Mock).mockRejectedValue(
                makeError(400, 'desired payload required')
            );

            const res = await request(app)
                .post('/api/merchant/products/desired')
                .set('Cookie', ['access_token=valid-token'])
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 400 when categoryUuid invalid', async () => {
            (productService.applyDesiredState as jest.Mock).mockRejectedValue(
                makeError(400, 'categoryUuid is required or invalid')
            );

            const res = await request(app)
                .post('/api/merchant/products/desired')
                .set('Cookie', ['access_token=valid-token'])
                .send({ product: { name: 'New' } });

            expect(res.status).toBe(400);
        });

        it('should call service with create mode', async () => {
            (productService.applyDesiredState as jest.Mock).mockResolvedValue({ statusCode: 201, data: {} });

            await request(app)
                .post('/api/merchant/products/desired')
                .set('Cookie', ['access_token=valid-token'])
                .send({ desired: '{}' });

            expect(productService.applyDesiredState).toHaveBeenCalledWith(
                expect.objectContaining({ storeId: 101, mode: 'create' })
            );
        });
    });

    // ─── PUT /api/merchant/products/:uuid/desired ───────────
    describe('PUT /api/merchant/products/:productUuid/desired (update)', () => {
        it('should return 200 on success', async () => {
            (productService.applyDesiredState as jest.Mock).mockResolvedValue({
                statusCode: 200,
                data: { uuid: 'p1', name: 'Updated Product' }
            });

            const res = await request(app)
                .put('/api/merchant/products/p1/desired')
                .set('Cookie', ['access_token=valid-token'])
                .send({ product: { name: 'Updated' }, variations: [], items: [], images: { product: [] } });

            expect(res.status).toBe(200);
            expect(res.body.uuid).toBe('p1');
        });

        it('should return 404 when product not found', async () => {
            (productService.applyDesiredState as jest.Mock).mockRejectedValue(
                makeError(404, 'Product not found')
            );

            const res = await request(app)
                .put('/api/merchant/products/nonexistent/desired')
                .set('Cookie', ['access_token=valid-token'])
                .send({});

            expect(res.status).toBe(404);
        });

        it('should return 409 on optimistic lock conflict', async () => {
            (productService.applyDesiredState as jest.Mock).mockRejectedValue(
                makeError(409, 'Conflict: product has been modified')
            );

            const res = await request(app)
                .put('/api/merchant/products/p1/desired')
                .set('Cookie', ['access_token=valid-token'])
                .send({ desired: '{"ifMatchUpdatedAt":"2026-01-01"}' });

            expect(res.status).toBe(409);
        });

        it('should call service with update mode and productUuid', async () => {
            (productService.applyDesiredState as jest.Mock).mockResolvedValue({ statusCode: 200, data: {} });

            await request(app)
                .put('/api/merchant/products/p1/desired')
                .set('Cookie', ['access_token=valid-token'])
                .send({});

            expect(productService.applyDesiredState).toHaveBeenCalledWith(
                expect.objectContaining({ storeId: 101, mode: 'update', productUuid: 'p1' })
            );
        });
    });

    // ─── PUT /api/merchant/products/:uuid/items/:itemUuid ───
    describe('PUT /api/merchant/products/:productUuid/items/:itemUuid', () => {
        it('should return 200 on success', async () => {
            (productService.updateProductItem as jest.Mock).mockResolvedValue({
                uuid: 'i1', sku: 'SKU-001', stockQuantity: 10, priceMinor: 9900, isEnable: true
            });

            const res = await request(app)
                .put('/api/merchant/products/p1/items/i1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ priceMinor: 9900 });

            expect(res.status).toBe(200);
            expect(res.body.uuid).toBe('i1');
        });

        it('should return 404 when item not found', async () => {
            (productService.updateProductItem as jest.Mock).mockRejectedValue(
                makeError(404, 'Item not found')
            );

            const res = await request(app)
                .put('/api/merchant/products/p1/items/nonexistent')
                .set('Cookie', ['access_token=valid-token'])
                .send({ priceMinor: 9900 });

            expect(res.status).toBe(404);
        });

        it('should return 400 when priceMinor is negative', async () => {
            const res = await request(app)
                .put('/api/merchant/products/p1/items/i1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ priceMinor: -100 });

            expect(res.status).toBe(400);
        });

        it('should return 400 when stockQuantity is negative', async () => {
            const res = await request(app)
                .put('/api/merchant/products/p1/items/i1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ stockQuantity: -5 });

            expect(res.status).toBe(400);
        });

        it('should pass correct args to service', async () => {
            (productService.updateProductItem as jest.Mock).mockResolvedValue({ uuid: 'i1' });

            await request(app)
                .put('/api/merchant/products/p1/items/i1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ priceMinor: 5000, stockDelta: 3 });

            expect(productService.updateProductItem).toHaveBeenCalledWith(
                101, 'p1', 'i1',
                expect.objectContaining({ priceMinor: 5000, stockDelta: 3 })
            );
        });

        it('should accept stockDelta (positive increment)', async () => {
            (productService.updateProductItem as jest.Mock).mockResolvedValue({ uuid: 'i1', stockQuantity: 15 });

            const res = await request(app)
                .put('/api/merchant/products/p1/items/i1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ stockDelta: 5 });

            expect(res.status).toBe(200);
        });

        it('should accept stockDelta (negative decrement)', async () => {
            (productService.updateProductItem as jest.Mock).mockResolvedValue({ uuid: 'i1', stockQuantity: 5 });

            const res = await request(app)
                .put('/api/merchant/products/p1/items/i1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ stockDelta: -3 });

            expect(res.status).toBe(200);
        });
    });
});

// ═══════════════════════════════════════════════════════════════
//  ProductService – Unit Tests
// ═══════════════════════════════════════════════════════════════
describe('ProductService – Unit Tests', () => {
    let ProductServiceClass: any;
    let service: any;
    let repoModule: any;
    let db: any;

    function makeTx() {
        return {
            commit: jest.fn(),
            rollback: jest.fn(),
            finished: undefined as string | undefined,
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
        db = require('@digishop/db');
        repoModule = require('../repositories/productRepository');

        const tx = makeTx();
        (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

        const actual = jest.requireActual('../services/productService') as any;
        ProductServiceClass = actual.ProductService;
        service = new ProductServiceClass();
    });

    function setupRepo(mocks: Record<string, any> = {}) {
        const defaults: Record<string, jest.Mock> = {
            findProductsList: jest.fn().mockResolvedValue({ rows: [], page: 1, pageSize: 20, total: 0, totalPages: 0 }),
            findProductDetailByUuidAndStore: jest.fn().mockResolvedValue(null),
            findAllCategories: jest.fn().mockResolvedValue([]),
            findProductForUpdate: jest.fn().mockResolvedValue(null),
            findProductForDelete: jest.fn().mockResolvedValue(null),
            findProductsForBulkDelete: jest.fn().mockResolvedValue([]),
            findProductWithRelationsByUuidForStore: jest.fn().mockResolvedValue(null),
            findProductByUuidForStore: jest.fn().mockResolvedValue(null),
            findProductItemByUuidForProduct: jest.fn().mockResolvedValue(null),
            findItemByUuidForProduct: jest.fn().mockResolvedValue(null),
            createProduct: jest.fn().mockResolvedValue({ id: 1, uuid: 'new-uuid', name: 'New', status: 'ACTIVE' }),
            updateProduct: jest.fn().mockResolvedValue(true),
            destroyProduct: jest.fn().mockResolvedValue(true),
            destroyProductsForBulkDelete: jest.fn().mockResolvedValue(true),
            bulkUpdateProductStatus: jest.fn().mockResolvedValue([2]),
            mapCategoryUuid: jest.fn().mockResolvedValue(1),
            findProductImagesByProductId: jest.fn().mockResolvedValue([]),
            findVariationsByProductId: jest.fn().mockResolvedValue([]),
            findProductItemsByProductId: jest.fn().mockResolvedValue([]),
            findFinalVariationsForCombo: jest.fn().mockResolvedValue([]),
            findVariationOptionsByUuidsForProduct: jest.fn().mockResolvedValue([]),
            findProductConfigurationsByItemId: jest.fn().mockResolvedValue([]),
            findProductItemImageByProductItemId: jest.fn().mockResolvedValue(null),
            findProductDetailByUuid: jest.fn().mockResolvedValue({ uuid: 'new-uuid', name: 'New' }),
            findProductByPk: jest.fn().mockResolvedValue(null),
            countMainProductImages: jest.fn().mockResolvedValue(0),
            findFirstProductImage: jest.fn().mockResolvedValue(null),
            setProductImageMainById: jest.fn().mockResolvedValue(true),
            clearMainProductImagesExcept: jest.fn().mockResolvedValue(true),
            setMainProductImage: jest.fn().mockResolvedValue(true),
            createProductImage: jest.fn().mockResolvedValue({ id: 1, uuid: 'img-uuid' }),
            deleteProductImageById: jest.fn().mockResolvedValue(true),
            updateProductImageByUuid: jest.fn().mockResolvedValue(true),
            createVariation: jest.fn().mockResolvedValue({ id: 1, uuid: 'var-uuid', name: 'Color' }),
            deleteVariationById: jest.fn().mockResolvedValue(true),
            updateVariationNameById: jest.fn().mockResolvedValue(true),
            findVariationByUuidForProduct: jest.fn().mockResolvedValue(null),
            findVariationOptionsByVariationId: jest.fn().mockResolvedValue([]),
            createVariationOption: jest.fn().mockResolvedValue({ id: 1, uuid: 'opt-uuid', value: 'Red' }),
            deleteVariationOptionById: jest.fn().mockResolvedValue(true),
            updateVariationOptionById: jest.fn().mockResolvedValue(true),
            findVariationOptionByUuidForVariation: jest.fn().mockResolvedValue(null),
            createProductItem: jest.fn().mockResolvedValue({ id: 1, uuid: 'item-uuid', sku: 'SKU-001' }),
            updateProductItemById: jest.fn().mockResolvedValue(true),
            deleteProductItemById: jest.fn().mockResolvedValue(true),
            deleteProductConfigurationsByItemId: jest.fn().mockResolvedValue(true),
            deleteProductConfigurationsByOptionIds: jest.fn().mockResolvedValue(true),
            createProductConfiguration: jest.fn().mockResolvedValue(true),
            createProductItemImage: jest.fn().mockResolvedValue({ id: 1 }),
            deleteProductItemImageById: jest.fn().mockResolvedValue(true),
            findProductsForSuggestion: jest.fn().mockResolvedValue([]),
            findSkuRowsForSuggestion: jest.fn().mockResolvedValue([]),
            findMainImagesByProductIds: jest.fn().mockResolvedValue([]),
        };

        Object.entries({ ...defaults, ...mocks }).forEach(([method, impl]) => {
            repoModule.productRepository[method] = impl;
        });

        return repoModule.productRepository;
    }

    // ─── suggestProducts ─────────────────────────────────────
    describe('suggestProducts', () => {
        it('should return empty result for empty query', async () => {
            setupRepo();
            const result = await service.suggestProducts(101, '');
            expect(result).toEqual({ products: [], skus: [] });
        });

        it('should return empty result for whitespace-only query', async () => {
            setupRepo();
            const result = await service.suggestProducts(101, '   ');
            expect(result).toEqual({ products: [], skus: [] });
        });

        it('should query products and skus from repo', async () => {
            const repo = setupRepo({
                findProductsForSuggestion: jest.fn().mockResolvedValue([
                    { id: 1, uuid: 'p1', name: 'Blue Shirt', category: { name: 'Clothing' } }
                ]),
                findMainImagesByProductIds: jest.fn().mockResolvedValue([])
            });

            const result = await service.suggestProducts(101, 'shirt');

            expect(repo.findProductsForSuggestion).toHaveBeenCalledWith(101, '%shirt%');
            expect(result.products).toHaveLength(1);
            expect(result.products[0].uuid).toBe('p1');
        });

        it('should escape special chars in query', async () => {
            const repo = setupRepo();
            await service.suggestProducts(101, '50% off_deal');
            expect(repo.findProductsForSuggestion).toHaveBeenCalledWith(101, '%50\\% off\\_deal%');
        });
    });

    // ─── getProductList ──────────────────────────────────────
    describe('getProductList', () => {
        it('should return data and meta', async () => {
            setupRepo({
                findProductsList: jest.fn().mockResolvedValue({
                    rows: [{ uuid: 'p1' }],
                    page: 1, pageSize: 20, total: 1, totalPages: 1
                })
            });

            const result = await service.getProductList(101, { page: '1', pageSize: '20' });

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
        });

        it('should clamp page to 1 on invalid input', async () => {
            const repo = setupRepo();
            await service.getProductList(101, { page: '0' });
            expect(repo.findProductsList).toHaveBeenCalledWith(101, expect.objectContaining({ page: 1 }));
        });

        it('should clamp pageSize to max 100', async () => {
            const repo = setupRepo();
            await service.getProductList(101, { pageSize: '999' });
            expect(repo.findProductsList).toHaveBeenCalledWith(101, expect.objectContaining({ pageSize: 100 }));
        });
    });

    // ─── getProductDetail ────────────────────────────────────
    describe('getProductDetail', () => {
        it('should return product when found', async () => {
            setupRepo({
                findProductDetailByUuidAndStore: jest.fn().mockResolvedValue({ uuid: 'p1', name: 'Test' })
            });

            const result = await service.getProductDetail(101, 'p1');
            expect(result.uuid).toBe('p1');
        });

        it('should throw 404 when not found', async () => {
            setupRepo({ findProductDetailByUuidAndStore: jest.fn().mockResolvedValue(null) });

            await expect(service.getProductDetail(101, 'nonexistent')).rejects.toThrow('Product not found');
        });
    });

    // ─── listCategories ──────────────────────────────────────
    describe('listCategories', () => {
        it('should return flat list by default', async () => {
            setupRepo({
                findAllCategories: jest.fn().mockResolvedValue([
                    { uuid: 'c1', name: 'Electronics', parent: null },
                    { uuid: 'c2', name: 'Phones', parent: { uuid: 'c1' } }
                ])
            });

            const result = await service.listCategories('true');

            expect(result).toHaveLength(2);
            expect(result[0].parentUuid).toBeNull();
            expect(result[1].parentUuid).toBe('c1');
        });

        it('should return nested tree when flat=false', async () => {
            setupRepo({
                findAllCategories: jest.fn().mockResolvedValue([
                    { uuid: 'c1', name: 'Electronics', parent: null },
                    { uuid: 'c2', name: 'Phones', parent: { uuid: 'c1' } }
                ])
            });

            const result = await service.listCategories('false');

            expect(result).toHaveLength(1);
            expect(result[0].children).toHaveLength(1);
        });
    });

    // ─── bulkUpdateProductStatus ─────────────────────────────
    describe('bulkUpdateProductStatus', () => {
        it('should update status and return count', async () => {
            setupRepo({ bulkUpdateProductStatus: jest.fn().mockResolvedValue([3]) });

            const result = await service.bulkUpdateProductStatus(101, ['p1', 'p2', 'p3'], 'ACTIVE');
            expect(result.updated).toBe(3);
        });

        it('should throw 400 when productUuids is empty', async () => {
            setupRepo();
            await expect(service.bulkUpdateProductStatus(101, [], 'ACTIVE')).rejects.toThrow();
        });

        it('should throw 400 when status is invalid', async () => {
            setupRepo();
            await expect(
                service.bulkUpdateProductStatus(101, ['p1'], 'INVALID')
            ).rejects.toThrow();
        });
    });

    // ─── deleteProduct ───────────────────────────────────────
    describe('deleteProduct', () => {
        it('should delete product and commit transaction', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const product = { id: 1, uuid: 'p1', images: [], items: [] };
            const repo = setupRepo({
                findProductForDelete: jest.fn().mockResolvedValue(product),
                destroyProduct: jest.fn().mockResolvedValue(true),
            });

            await service.deleteProduct(101, 'p1');

            expect(repo.destroyProduct).toHaveBeenCalledWith(product, expect.anything());
            expect(tx.commit).toHaveBeenCalled();
        });

        it('should throw 404 when product not found', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);
            setupRepo({ findProductForDelete: jest.fn().mockResolvedValue(null) });

            await expect(service.deleteProduct(101, 'nonexistent')).rejects.toThrow('Product not found');
            expect(tx.rollback).toHaveBeenCalled();
        });
    });

    // ─── bulkDeleteProducts ──────────────────────────────────
    describe('bulkDeleteProducts', () => {
        it('should delete all products and commit', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const products = [{ images: [] }, { images: [] }];
            const repo = setupRepo({
                findProductsForBulkDelete: jest.fn().mockResolvedValue(products),
                destroyProductsForBulkDelete: jest.fn().mockResolvedValue(true),
            });

            await service.bulkDeleteProducts(101, ['p1', 'p2']);

            expect(repo.destroyProductsForBulkDelete).toHaveBeenCalled();
            expect(tx.commit).toHaveBeenCalled();
        });

        it('should throw 400 when productUuids is empty', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);
            setupRepo();

            await expect(service.bulkDeleteProducts(101, [])).rejects.toThrow();
            expect(tx.rollback).toHaveBeenCalled();
        });
    });

    // ─── duplicateProduct ────────────────────────────────────
    describe('duplicateProduct', () => {
        it('should create a copy and commit', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const source = {
                id: 1, uuid: 'p1', name: 'Original', categoryId: 5,
                description: 'Desc', status: 'ACTIVE', storeId: 101,
                images: [], variations: [], items: []
            };
            const destination = { id: 2, uuid: 'p2', name: 'Original (Copy)' };
            const repo = setupRepo({
                findProductWithRelationsByUuidForStore: jest.fn().mockResolvedValue(source),
                createProduct: jest.fn().mockResolvedValue(destination),
            });

            const result = await service.duplicateProduct(101, 'p1');

            expect(result.uuid).toBe('p2');
            expect(result.name).toBe('Original (Copy)');
            expect(tx.commit).toHaveBeenCalled();
        });

        it('should duplicate images', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const source = {
                id: 1, uuid: 'p1', name: 'Original', categoryId: 5,
                description: null, status: 'ACTIVE', storeId: 101,
                images: [{ url: 'http://img.jpg', blobName: 'blob1', fileName: 'img.jpg', isMain: true }],
                variations: [], items: []
            };
            const destination = { id: 2, uuid: 'p2', name: 'Original (Copy)' };
            const repo = setupRepo({
                findProductWithRelationsByUuidForStore: jest.fn().mockResolvedValue(source),
                createProduct: jest.fn().mockResolvedValue(destination),
            });

            await service.duplicateProduct(101, 'p1');

            expect(repo.createProductImage).toHaveBeenCalledWith(
                expect.objectContaining({ productId: 2, url: 'http://img.jpg' }),
                expect.anything()
            );
        });

        it('should duplicate variations and options', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const source = {
                id: 1, uuid: 'p1', name: 'Original', categoryId: 5,
                description: null, status: 'ACTIVE', storeId: 101,
                images: [],
                variations: [
                    { id: 10, name: 'Color', options: [{ id: 100, value: 'Red', sortOrder: 0 }] }
                ],
                items: []
            };
            const destination = { id: 2, uuid: 'p2', name: 'Original (Copy)' };
            const repo = setupRepo({
                findProductWithRelationsByUuidForStore: jest.fn().mockResolvedValue(source),
                createProduct: jest.fn().mockResolvedValue(destination),
                createVariation: jest.fn().mockResolvedValue({ id: 20, uuid: 'var2', name: 'Color' }),
                createVariationOption: jest.fn().mockResolvedValue({ id: 200, uuid: 'opt2', value: 'Red' }),
            });

            await service.duplicateProduct(101, 'p1');

            expect(repo.createVariation).toHaveBeenCalledWith(2, 'Color', expect.anything());
            expect(repo.createVariationOption).toHaveBeenCalledWith(20, expect.objectContaining({ value: 'Red' }), expect.anything());
        });

        it('should throw 404 when source product not found', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);
            setupRepo({ findProductWithRelationsByUuidForStore: jest.fn().mockResolvedValue(null) });

            await expect(service.duplicateProduct(101, 'nonexistent')).rejects.toThrow('Product not found');
            expect(tx.rollback).toHaveBeenCalled();
        });
    });

    // ─── updateProductItem ───────────────────────────────────
    describe('updateProductItem', () => {
        it('should update item and return refreshed data', async () => {
            const product = { id: 1, uuid: 'p1' };
            const item = {
                id: 10, uuid: 'i1', sku: 'SKU-001',
                stockQuantity: 5, priceMinor: 9900,
                isEnable: true,
                increment: jest.fn(),
                decrement: jest.fn(),
            };
            const refreshed = { uuid: 'i1', sku: 'SKU-001', stockQuantity: 5, priceMinor: 5000, imageUrl: null, isEnable: true };

            // sequelize.transaction with callback
            (db.sequelize.transaction as jest.Mock).mockImplementation(async (cb: any) => cb({}));

            setupRepo({
                findProductByUuidForStore: jest.fn().mockResolvedValue(product),
                findProductItemByUuidForProduct: jest.fn().mockResolvedValue(item),
                updateProductItemById: jest.fn().mockResolvedValue(true),
                findItemByUuidForProduct: jest.fn().mockResolvedValue(refreshed),
            });

            const result = await service.updateProductItem(101, 'p1', 'i1', { priceMinor: 5000 });

            expect(result.uuid).toBe('i1');
            expect(result.priceMinor).toBe(5000);
        });

        it('should throw 404 when product not found', async () => {
            (db.sequelize.transaction as jest.Mock).mockImplementation(async (cb: any) => cb({}));
            setupRepo({ findProductByUuidForStore: jest.fn().mockResolvedValue(null) });

            await expect(service.updateProductItem(101, 'nonexistent', 'i1', {})).rejects.toThrow('Product not found');
        });

        it('should throw 404 when item not found', async () => {
            const product = { id: 1, uuid: 'p1' };
            (db.sequelize.transaction as jest.Mock).mockImplementation(async (cb: any) => cb({}));
            setupRepo({
                findProductByUuidForStore: jest.fn().mockResolvedValue(product),
                findProductItemByUuidForProduct: jest.fn().mockResolvedValue(null),
            });

            await expect(service.updateProductItem(101, 'p1', 'nonexistent', {})).rejects.toThrow('Item not found');
        });

        it('should use increment for positive stockDelta', async () => {
            const product = { id: 1, uuid: 'p1' };
            const item = {
                id: 10, uuid: 'i1', sku: 'SKU-001',
                stockQuantity: 5, priceMinor: 9900, isEnable: true,
                increment: jest.fn().mockResolvedValue(true),
                decrement: jest.fn(),
            };
            const refreshed = { uuid: 'i1', sku: 'SKU-001', stockQuantity: 8, priceMinor: 9900, imageUrl: null, isEnable: true };

            (db.sequelize.transaction as jest.Mock).mockImplementation(async (cb: any) => cb({}));
            setupRepo({
                findProductByUuidForStore: jest.fn().mockResolvedValue(product),
                findProductItemByUuidForProduct: jest.fn().mockResolvedValue(item),
                updateProductItemById: jest.fn().mockResolvedValue(true),
                findItemByUuidForProduct: jest.fn().mockResolvedValue(refreshed),
            });

            await service.updateProductItem(101, 'p1', 'i1', { stockDelta: 3 });

            expect(item.increment).toHaveBeenCalledWith('stockQuantity', expect.objectContaining({ by: 3 }));
        });

        it('should use decrement for negative stockDelta', async () => {
            const product = { id: 1, uuid: 'p1' };
            const item = {
                id: 10, uuid: 'i1', sku: 'SKU-001',
                stockQuantity: 10, priceMinor: 9900, isEnable: true,
                increment: jest.fn(),
                decrement: jest.fn().mockResolvedValue(true),
            };
            const refreshed = { uuid: 'i1', sku: 'SKU-001', stockQuantity: 7, priceMinor: 9900, imageUrl: null, isEnable: true };

            (db.sequelize.transaction as jest.Mock).mockImplementation(async (cb: any) => cb({}));
            setupRepo({
                findProductByUuidForStore: jest.fn().mockResolvedValue(product),
                findProductItemByUuidForProduct: jest.fn().mockResolvedValue(item),
                updateProductItemById: jest.fn().mockResolvedValue(true),
                findItemByUuidForProduct: jest.fn().mockResolvedValue(refreshed),
            });

            await service.updateProductItem(101, 'p1', 'i1', { stockDelta: -3 });

            expect(item.decrement).toHaveBeenCalledWith('stockQuantity', expect.objectContaining({ by: 3 }));
        });
    });

    // ─── applyDesiredState (create) ──────────────────────────
    describe('applyDesiredState – create mode', () => {
        const minimalDesired = JSON.stringify({
            product: { name: 'New Product', status: 'ACTIVE', categoryUuid: 'cat-uuid' },
            images: { product: [] },
            variations: [{ name: 'Default', options: [{ value: 'One', sortOrder: 0 }] }],
            items: [{ sku: 'SKU-001', priceMinor: 9900, isEnable: true, optionRefs: [] }]
        });

        it('should create product, commit, and return statusCode 201', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const newProduct = { id: 1, uuid: 'new-uuid', name: 'New Product' };
            const repo = setupRepo({
                mapCategoryUuid: jest.fn().mockResolvedValue(5),
                createProduct: jest.fn().mockResolvedValue(newProduct),
                findProductDetailByUuid: jest.fn().mockResolvedValue(newProduct),
                createVariation: jest.fn().mockResolvedValue({ id: 10, uuid: 'var-uuid', name: 'Default' }),
                createVariationOption: jest.fn().mockResolvedValue({ id: 100, uuid: 'opt-uuid', value: 'One' }),
                findFinalVariationsForCombo: jest.fn().mockResolvedValue([
                    { id: 10, name: 'Default', uuid: 'var-uuid', options: [{ id: 100, uuid: 'opt-uuid', value: 'One', sortOrder: 0 }] }
                ]),
                createProductItem: jest.fn().mockResolvedValue({ id: 50, uuid: 'item-uuid', sku: 'SKU-001' }),
            });

            const result = await service.applyDesiredState({
                storeId: 101,
                mode: 'create',
                desiredRaw: minimalDesired,
                files: { productImages: undefined, itemImages: undefined }
            });

            expect(result.statusCode).toBe(201);
            expect(repo.createProduct).toHaveBeenCalledWith(
                expect.objectContaining({ storeId: 101, name: 'New Product' }),
                expect.anything()
            );
            expect(tx.commit).toHaveBeenCalled();
        });

        it('should throw 400 when desiredRaw is missing', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);
            setupRepo();

            await expect(service.applyDesiredState({
                storeId: 101, mode: 'create',
                desiredRaw: undefined,
                files: {}
            })).rejects.toThrow('desired payload required');
        });

        it('should throw 400 when categoryUuid invalid', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);
            setupRepo({ mapCategoryUuid: jest.fn().mockResolvedValue(null) });

            await expect(service.applyDesiredState({
                storeId: 101, mode: 'create',
                desiredRaw: minimalDesired,
                files: {}
            })).rejects.toThrow('categoryUuid is required or invalid');
        });

        it('should throw 400 when no variations', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const desired = JSON.stringify({
                product: { name: 'Product', status: 'ACTIVE', categoryUuid: 'cat-uuid' },
                images: { product: [] },
                variations: [],
                items: []
            });
            const newProduct = { id: 1, uuid: 'new-uuid', name: 'Product' };
            setupRepo({
                mapCategoryUuid: jest.fn().mockResolvedValue(5),
                createProduct: jest.fn().mockResolvedValue(newProduct),
                findFinalVariationsForCombo: jest.fn().mockResolvedValue([]),
            });

            await expect(service.applyDesiredState({
                storeId: 101, mode: 'create',
                desiredRaw: desired,
                files: {}
            })).rejects.toThrow('At least one variation is required');
        });
    });

    // ─── applyDesiredState (update) ──────────────────────────
    describe('applyDesiredState – update mode', () => {
        it('should throw 400 when productUuid missing', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);
            setupRepo();

            await expect(service.applyDesiredState({
                storeId: 101, mode: 'update',
                productUuid: undefined,
                desiredRaw: '{"product":{},"images":{"product":[]},"variations":[],"items":[]}',
                files: {}
            })).rejects.toThrow('productUuid is required');
        });

        it('should throw 404 when product not found', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);
            setupRepo({ findProductForUpdate: jest.fn().mockResolvedValue(null) });

            await expect(service.applyDesiredState({
                storeId: 101, mode: 'update',
                productUuid: 'nonexistent',
                desiredRaw: '{"product":{},"images":{"product":[]},"variations":[],"items":[]}',
                files: {}
            })).rejects.toThrow('Product not found');
        });

        it('should throw 409 on optimistic lock conflict', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const existingProduct = {
                id: 1, uuid: 'p1', name: 'Old', status: 'ACTIVE',
                updatedAt: new Date('2026-01-01T00:00:00Z')
            };

            const desired = JSON.stringify({
                product: { name: 'Updated' },
                images: { product: [] },
                variations: [],
                items: [],
                ifMatchUpdatedAt: '2025-12-01T00:00:00Z' // stale timestamp
            });

            setupRepo({ findProductForUpdate: jest.fn().mockResolvedValue(existingProduct) });

            await expect(service.applyDesiredState({
                storeId: 101, mode: 'update',
                productUuid: 'p1',
                desiredRaw: desired,
                files: {}
            })).rejects.toThrow('Conflict: product has been modified');
        });
    });
});
