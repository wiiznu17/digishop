import request from 'supertest';
import app from '../app';
import { Store, Product } from '@digishop/db';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { productService } from '../services/productService';

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

describe('Product API', () => {
  const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

  beforeEach(() => {
    jest.clearAllMocks();
    (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
    (redis.get as jest.Mock).mockResolvedValue(mockSession);
    (Store.findOne as jest.Mock).mockResolvedValue({ id: 101, status: 'APPROVED' });
  });

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
  });

  describe('GET /api/merchant/products/:uuid', () => {
    it('should return 200 and product detail', async () => {
      (productService.getProductDetail as jest.Mock).mockResolvedValue({ uuid: 'p1', name: 'Product 1' });

      const res = await request(app)
        .get('/api/merchant/products/p1')
        .set('Cookie', ['access_token=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body.uuid).toBe('p1');
    });
  });

  describe('DELETE /api/merchant/products/:uuid', () => {
    it('should return 204 on success', async () => {
        (productService.deleteProduct as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app)
          .delete('/api/merchant/products/p1')
          .set('Cookie', ['access_token=valid-token']);

        expect(res.status).toBe(204);
    });
  });

  describe('POST /api/merchant/products/:uuid/duplicate', () => {
    it('should return 201 and duplicated product', async () => {
        (productService.duplicateProduct as jest.Mock).mockResolvedValue({ uuid: 'p2', name: 'Product 1 Copy' });

        const res = await request(app)
          .post('/api/merchant/products/p1/duplicate')
          .set('Cookie', ['access_token=valid-token']);

        expect(res.status).toBe(201);
    });
  });

  describe('PATCH /api/merchant/products/bulk/status', () => {
    it('should return 200 when bulk update success', async () => {
        (productService.bulkUpdateProductStatus as jest.Mock).mockResolvedValue({ updated: 2 });

        const res = await request(app)
          .patch('/api/merchant/products/bulk/status')
          .set('Cookie', ['access_token=valid-token'])
          .send({ productUuids: ['p1', 'p2'], status: 'PUBLISHED' });

        expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/merchant/products/bulk/delete', () => {
    it('should return 204 when bulk delete success', async () => {
        (productService.bulkDeleteProducts as jest.Mock).mockResolvedValue({ count: 2 });

        const res = await request(app)
          .delete('/api/merchant/products/bulk/delete')
          .set('Cookie', ['access_token=valid-token'])
          .send({ productUuids: ['p1', 'p2'] });

        expect(res.status).toBe(204);
    });
  });

  describe('POST /api/merchant/products/desired', () => {
    it('should return 201 on success', async () => {
        (productService.applyDesiredState as jest.Mock).mockResolvedValue({ 
            statusCode: 201, 
            data: { uuid: 'new-p' } 
        });

        const res = await request(app)
          .post('/api/merchant/products/desired')
          .set('Cookie', ['access_token=valid-token'])
          .send({ product: { name: 'New' }, variations: [], items: [], images: { product: [] } });

        expect(res.status).toBe(201);
    });
  });

  describe('PUT /api/merchant/products/:uuid/desired', () => {
    it('should return 200 on success', async () => {
        (productService.applyDesiredState as jest.Mock).mockResolvedValue({ 
            statusCode: 200, 
            data: { uuid: 'p1' } 
        });

        const res = await request(app)
          .put('/api/merchant/products/p1/desired')
          .set('Cookie', ['access_token=valid-token'])
          .send({ product: { name: 'Updated' }, variations: [], items: [], images: { product: [] } });

        expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/merchant/products/:uuid/items/:itemUuid', () => {
    it('should return 200 on success', async () => {
        (productService.updateProductItem as jest.Mock).mockResolvedValue({ uuid: 'i1' });

        const res = await request(app)
          .put('/api/merchant/products/p1/items/i1')
          .set('Cookie', ['access_token=valid-token'])
          .send({ priceMinor: 1000 });

        expect(res.status).toBe(200);
    });
  });

  describe('GET /api/merchant/products/categories/list', () => {
    it('should return 200 and categories', async () => {
        (productService.listCategories as jest.Mock).mockResolvedValue([{ uuid: 'c1', name: 'Cat 1' }]);

        const res = await request(app)
          .get('/api/merchant/products/categories/list')
          .set('Cookie', ['access_token=valid-token']);

        expect(res.status).toBe(200);
    });
  });

  describe('GET /api/merchant/products/suggest', () => {
    it('should return 200 and suggestions', async () => {
        (productService.suggestProducts as jest.Mock).mockResolvedValue({ products: [], skus: [] });

        const res = await request(app)
          .get('/api/merchant/products/suggest?q=test')
          .set('Cookie', ['access_token=valid-token']);

        expect(res.status).toBe(200);
    });
  });
});
