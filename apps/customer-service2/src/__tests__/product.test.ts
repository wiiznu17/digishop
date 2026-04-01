import request from 'supertest';
import app from '../app';
import { productService } from '../services/productService';

jest.mock('../services/productService');

describe('Product API (Customer)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /customer/product/', () => {
        it('should return 200 and all products', async () => {
            (productService.getAllProducts as jest.Mock).mockResolvedValue({
                data: [{ id: 1, name: 'Product A' }]
            });

            const res = await request(app).get('/customer/product/');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('GET /customer/product/search', () => {
        it('should return 200 and search results', async () => {
            (productService.searchProduct as jest.Mock).mockResolvedValue({
                product: [{ id: 1, name: 'Search Result' }],
                productCount: 1,
                store: []
            });

            const res = await request(app).get('/customer/product/search?query=test');

            expect(res.status).toBe(200);
            expect(res.body.product).toHaveLength(1);
        });
    });

    describe('GET /customer/product/:id', () => {
        it('should return 200 and product detail', async () => {
            (productService.getProduct as jest.Mock).mockResolvedValue({
                data: { id: 1, name: 'Product A' },
                choices: []
            });

            const res = await request(app).get('/customer/product/1');

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(1);
        });
    });

    describe('GET /customer/product/store/:id', () => {
        it('should return 200 and store products', async () => {
            (productService.getStoreProduct as jest.Mock).mockResolvedValue({
                data: [{ id: 1, name: 'Store Product' }]
            });

            const res = await request(app).get('/customer/product/store/1');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });
});
