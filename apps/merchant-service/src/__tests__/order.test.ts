import request from 'supertest';
import app from '../app';
import { Store, sequelize } from '@digishop/db';
import { redis } from '../lib/redis/client';
import { verifyAccess } from '../lib/jwtVerfify';
import { orderService } from '../services/orderService';
import { AppError } from '../errors/AppError';

jest.mock('../services/orderService');
jest.mock('../repositories/orderRepository');

// ───────────────────────────────────────────────────────────────
//  Helpers
// ───────────────────────────────────────────────────────────────
const mockSession = JSON.stringify({ userId: 1, jti: 'test-jti' });

function authedRequest() {
    return { cookie: 'access_token=valid-token' };
}

function setupAuth() {
    (verifyAccess as jest.Mock).mockReturnValue({ jti: 'test-jti', sub: 1 });
    (redis.get as jest.Mock).mockResolvedValue(mockSession);
    (Store.findOne as jest.Mock).mockResolvedValue({ id: 101, status: 'APPROVED' });
}

function makeAppError(statusCode: number, body: Record<string, unknown>) {
    return new AppError(
        String(body.error ?? body.message ?? 'Error'),
        statusCode,
        true,
        body,
    );
}

// ───────────────────────────────────────────────────────────────
//  API-Level Tests (Routes + Controller)
// ───────────────────────────────────────────────────────────────
describe('Order API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAuth();
    });

    // ─── GET /api/merchant/orders ────────────────────────────
    describe('GET /api/merchant/orders', () => {
        it('should return 200 and order list', async () => {
            const mockResult = { data: [{ id: 1, uuid: 'o1' }], meta: { total: 1 } };
            (orderService.getOrderList as jest.Mock).mockResolvedValue(mockResult);

            const res = await request(app)
                .get('/api/merchant/orders')
                .set('Cookie', [authedRequest().cookie]);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should pass query params to service', async () => {
            (orderService.getOrderList as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });

            await request(app)
                .get('/api/merchant/orders?page=2&pageSize=10&status=PAID&sortBy=createdAt&sortDir=ASC')
                .set('Cookie', [authedRequest().cookie]);

            expect(orderService.getOrderList).toHaveBeenCalledWith(
                101,
                expect.objectContaining({
                    page: '2',
                    pageSize: '10',
                    status: 'PAID',
                    sortBy: 'createdAt',
                    sortDir: 'ASC',
                })
            );
        });

        it('should return 401 when no auth cookie', async () => {
            (verifyAccess as jest.Mock).mockImplementation(() => {
                throw new Error('invalid token');
            });

            const res = await request(app).get('/api/merchant/orders');
            expect(res.status).toBe(401);
        });
    });

    // ─── GET /api/merchant/orders/summary ────────────────────
    describe('GET /api/merchant/orders/summary', () => {
        it('should return 200 and summary', async () => {
            (orderService.getOrdersSummary as jest.Mock).mockResolvedValue({ totalRevenue: 50000 });

            const res = await request(app)
                .get('/api/merchant/orders/summary')
                .set('Cookie', [authedRequest().cookie]);

            expect(res.status).toBe(200);
            expect(res.body.totalRevenue).toBe(50000);
        });

        it('should pass date range query params', async () => {
            (orderService.getOrdersSummary as jest.Mock).mockResolvedValue({ totalRevenue: 0 });

            await request(app)
                .get('/api/merchant/orders/summary?startDate=2026-01-01&endDate=2026-01-31')
                .set('Cookie', [authedRequest().cookie]);

            expect(orderService.getOrdersSummary).toHaveBeenCalledWith(
                101,
                expect.objectContaining({ startDate: '2026-01-01', endDate: '2026-01-31' })
            );
        });
    });

    // ─── GET /api/merchant/orders/:orderId ────────────────────
    describe('GET /api/merchant/orders/:orderId', () => {
        it('should return 200 and order detail', async () => {
            (orderService.getOrderDetail as jest.Mock).mockResolvedValue({ id: 1, uuid: 'o1' });

            const res = await request(app)
                .get('/api/merchant/orders/o1')
                .set('Cookie', [authedRequest().cookie]);

            expect(res.status).toBe(200);
            expect(res.body.uuid).toBe('o1');
        });

        it('should return 404 when order not found', async () => {
            (orderService.getOrderDetail as jest.Mock).mockRejectedValue(
                makeAppError(404, { error: 'Order not found' })
            );

            const res = await request(app)
                .get('/api/merchant/orders/nonexistent')
                .set('Cookie', [authedRequest().cookie]);

            expect(res.status).toBe(404);
        });

        it('should return 403 when order not in store', async () => {
            (orderService.getOrderDetail as jest.Mock).mockRejectedValue(
                makeAppError(403, { error: "Forbidden: You don't have access to this order" })
            );

            const res = await request(app)
                .get('/api/merchant/orders/999')
                .set('Cookie', [authedRequest().cookie]);

            expect(res.status).toBe(403);
        });
    });

    // ─── PATCH /api/merchant/orders/:orderId ──────────────────
    describe('PATCH /api/merchant/orders/:orderId', () => {
        it('should return 200 on update success', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({ id: 1 });

            const res = await request(app)
                .patch('/api/merchant/orders/o1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'PROCESSING' });

            expect(res.status).toBe(200);
        });

        it('should pass correct payload shape to service', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({ id: 1 });

            await request(app)
                .patch('/api/merchant/orders/o1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'PROCESSING' });

            expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderId: 'o1',
                    storeId: 101,
                    payload: expect.objectContaining({ status: 'PROCESSING' }),
                })
            );
        });

        it('should return 400 on invalid status value', async () => {
            const res = await request(app)
                .patch('/api/merchant/orders/o1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'INVALID_STATUS' });

            expect(res.status).toBe(400);
        });

        it('should return 400 when status field is missing', async () => {
            const res = await request(app)
                .patch('/api/merchant/orders/o1')
                .set('Cookie', [authedRequest().cookie])
                .send({});

            expect(res.status).toBe(400);
        });
    });
});

// ───────────────────────────────────────────────────────────────
//  Order Status Flow Tests (via PATCH endpoint)
// ───────────────────────────────────────────────────────────────
describe('Order Status Flow Tests (PATCH /api/merchant/orders/:orderId)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAuth();
    });

    // ─── Valid Merchant Transitions ──────────────────────────

    describe('PAID → PROCESSING', () => {
        it('should accept transition', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({
                data: { id: '1', status: 'PROCESSING' },
            });

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'PROCESSING' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('PROCESSING');
        });
    });

    describe('PAID → CANCELLED (merchant cancel)', () => {
        it('should accept merchant cancellation from PAID', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({
                data: { id: '1', status: 'MERCHANT_CANCELED' },
            });

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'CANCELLED' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('MERCHANT_CANCELED');
        });
    });

    describe('PROCESSING → SHIPPED (ready to ship)', () => {
        it('should accept PROCESSING → SHIPPED via zod schema', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({
                data: { id: '1', status: 'READY_TO_SHIP' },
            });

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'SHIPPED' });

            expect(res.status).toBe(200);
        });
    });

    describe('REFUND_REQUEST → REFUND_APPROVED', () => {
        it('should accept merchant approving refund', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({
                data: { id: '1', status: 'REFUND_APPROVED' },
            });

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'REFUNDED' });

            expect(res.status).toBe(200);
        });
    });

    describe('REFUND_REQUEST → REFUND_REJECTED', () => {
        it('should accept merchant rejecting refund', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({
                data: { id: '1', status: 'REFUND_REJECTED' },
            });

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'CANCELLED' });

            expect(res.status).toBe(200);
        });
    });

    describe('REFUND_FAIL → REFUND_RETRY', () => {
        it('should accept retrying failed refund', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({
                data: { id: '1', status: 'REFUND_RETRY' },
            });

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'REFUNDED' });

            expect(res.status).toBe(200);
        });
    });

    // ─── Terminal state errors ───────────────────────────────

    describe('Terminal Order States', () => {
        const terminalStatuses = ['COMPLETE', 'CUSTOMER_CANCELED', 'REFUND_SUCCESS', 'RETURN_FAIL'];

        terminalStatuses.forEach((terminal) => {
            it(`should return 400 for transition attempt from ${terminal}`, async () => {
                (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
                    makeAppError(400, { error: `Order is terminal (${terminal}), cannot transition` })
                );

                const res = await request(app)
                    .patch('/api/merchant/orders/1')
                    .set('Cookie', [authedRequest().cookie])
                    .send({ status: 'PROCESSING' });

                expect(res.status).toBe(400);
            });
        });
    });

    // ─── Invalid transitions ────────────────────────────────

    describe('Invalid Status Transitions', () => {
        const invalidTransitions = [
            { from: 'PAID', to: 'DELIVERED', desc: 'PAID cannot skip to DELIVERED' },
            { from: 'PAID', to: 'COMPLETE', desc: 'PAID cannot skip to COMPLETE' },
            { from: 'PAID', to: 'SHIPPED', desc: 'PAID cannot skip to SHIPPED' },
            { from: 'PAID', to: 'READY_TO_SHIP', desc: 'PAID cannot skip to READY_TO_SHIP' },
            { from: 'PROCESSING', to: 'DELIVERED', desc: 'PROCESSING cannot skip to DELIVERED' },
            { from: 'PROCESSING', to: 'MERCHANT_CANCELED', desc: 'PROCESSING cannot cancel' },
            { from: 'READY_TO_SHIP', to: 'COMPLETE', desc: 'READY_TO_SHIP cannot skip to COMPLETE' },
            { from: 'DELIVERED', to: 'PROCESSING', desc: 'DELIVERED cannot go back to PROCESSING' },
            { from: 'REFUND_REQUEST', to: 'PROCESSING', desc: 'REFUND_REQUEST cannot go to PROCESSING' },
            { from: 'REFUND_APPROVED', to: 'PAID', desc: 'REFUND_APPROVED cannot go back to PAID' },
        ];

        invalidTransitions.forEach(({ from, to, desc }) => {
            it(`should return 400: ${desc}`, async () => {
                (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
                    makeAppError(400, {
                        error: `Invalid transition for merchant: ${from} -> ${to}`,
                        allowedNext: [],
                    })
                );

                const res = await request(app)
                    .patch('/api/merchant/orders/1')
                    .set('Cookie', [authedRequest().cookie])
                    .send({ status: 'PROCESSING' });

                expect(res.status).toBe(400);
            });
        });
    });

    // ─── Authorization errors ────────────────────────────────

    describe('Authorization & Access Control', () => {
        it('should return 403 when store context is missing', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
                makeAppError(403, { error: 'Forbidden: Store context required' })
            );

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'PROCESSING' });

            expect(res.status).toBe(403);
        });

        it('should return 403 when order does not belong to store', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
                makeAppError(403, { error: "Forbidden: You don't have access to this order" })
            );

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'PROCESSING' });

            expect(res.status).toBe(403);
        });

        it('should return 404 when order is not found', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
                makeAppError(404, { error: 'Order not found' })
            );

            const res = await request(app)
                .patch('/api/merchant/orders/99999')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'PROCESSING' });

            expect(res.status).toBe(404);
        });
    });

    // ─── Conflict errors (409) ───────────────────────────────

    describe('Conflict Errors', () => {
        it('should return 409 when RETURN_VERIFIED from wrong state', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
                makeAppError(409, { error: 'order_not_in_receive_return' })
            );

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'COMPLETED' });

            expect(res.status).toBe(409);
        });

        it('should return 409 when return shipment already exists', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
                makeAppError(409, { error: 'return_shipment_already_exists' })
            );

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'SHIPPED' });

            expect(res.status).toBe(409);
        });

        it('should return 409 when order not delivered for return', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(
                makeAppError(409, { error: 'order_not_delivered_cannot_request_return' })
            );

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'SHIPPED' });

            expect(res.status).toBe(409);
        });
    });

    // ─── 500 errors ──────────────────────────────────────────

    describe('Server Errors', () => {
        it('should return 500 on unhandled service error', async () => {
            (orderService.updateOrderStatus as jest.Mock).mockRejectedValue(new Error('Unexpected'));

            const res = await request(app)
                .patch('/api/merchant/orders/1')
                .set('Cookie', [authedRequest().cookie])
                .send({ status: 'PROCESSING' });

            expect(res.status).toBe(500);
        });
    });
});

// ───────────────────────────────────────────────────────────────
//  OrderService.updateOrderStatus — Unit Tests
//  (Testing the real service logic with mocked repository)
// ───────────────────────────────────────────────────────────────
describe('OrderService.updateOrderStatus – Unit Tests', () => {
    let OrderServiceClass: any;
    let service: any;
    let repoModule: any;
    let db: any;

    // Fresh transaction mock for each test
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
        repoModule = require('../repositories/orderRepository');

        // Always ensure sequelize.transaction returns a valid mock tx
        const tx = makeTx();
        (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

        // Get the actual service class (bypass the module-level mock)
        const actual = jest.requireActual('../services/orderService') as any;
        OrderServiceClass = actual.OrderService;
        service = new OrderServiceClass();
    });

    // ── Helper: build mock order ─────────────────────────────
    function makeOrder(overrides: Record<string, unknown> = {}) {
        const base: Record<string, any> = {
            id: 1,
            status: 'PAID',
            storeId: 101,
            grandTotalMinor: 100000,
            grand_total_minor: 100000,
            currencyCode: 'THB',
            currency_code: 'THB',
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
            checkout: {
                id: 1,
                orderCode: 'ORD-001',
                customer: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
                payment: {
                    id: 10,
                    paymentMethod: 'CREDIT_CARD',
                    provider: 'TEST_PGW',
                    providerRef: 'PGW-REF-001',
                    channel: 'CARD',
                    amountAuthorizedMinor: 100000,
                    amountCapturedMinor: 100000,
                    amountRefundedMinor: 0,
                    pgwStatus: 'APPROVED',
                    paidAt: new Date(),
                },
            },
            shippingInfo: null,
            items: [],
            statusHistory: [],
            returnShipments: [],
            refundOrders: [],
            reference: 'ORDER-REF-001',
            ...overrides,
        };
        // Add `get` method that mimics Sequelize model
        base.get = (key: string) => base[key];
        base.update = jest.fn().mockResolvedValue(true);
        base.reload = jest.fn().mockResolvedValue(true);
        return base;
    }

    function makeInput(payload: Record<string, any>, overrides: Record<string, any> = {}) {
        return {
            orderId: '1',
            storeId: 101,
            authMode: 'user' as const,
            userSub: 1,
            userId: 1,
            headers: { requestId: 'req-123', correlationId: 'cor-123', userAgent: 'test' },
            ip: '127.0.0.1',
            payload,
            ...overrides,
        };
    }

    // ── Helper: set up repository mock methods ───────────────
    function setupRepo(order: any, extraMocks: Record<string, any> = {}) {
        const defaults: Record<string, any> = {
            findOrderByIdAndStore: jest.fn().mockResolvedValue(1),
            findOrderByPkWithBaseIncludes: jest.fn().mockResolvedValue(order),
            updateOrderStatus: jest.fn().mockResolvedValue(true),
            createOrderStatusHistory: jest.fn().mockResolvedValue({ id: 1 }),
            findLatestShipmentEvent: jest.fn().mockResolvedValue(null),
            updateShippingInfo: jest.fn().mockResolvedValue(true),
            createShipmentEvent: jest.fn().mockResolvedValue({ id: 1 }),
            findReturnShipmentByOrderId: jest.fn().mockResolvedValue(null),
            findRefundOrderByOrderId: jest.fn().mockResolvedValue(null),
            createRefundOrder: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED', amountMinor: 100000 }),
            updateRefundOrder: jest.fn().mockResolvedValue(true),
            createRefundStatusHistory: jest.fn().mockResolvedValue({ id: 1 }),
            createReturnShipment: jest.fn().mockResolvedValue({ id: 1, status: 'AWAITING_DROP' }),
            createReturnShipmentEvent: jest.fn().mockResolvedValue({ id: 1 }),
            reloadOrderWithBaseIncludes: jest.fn().mockResolvedValue(true),
            findFreshOrderWithBaseIncludes: jest.fn().mockResolvedValue(order),
            updateOrderStatusById: jest.fn().mockResolvedValue([1]),
            createPaymentGatewayEvent: jest.fn().mockResolvedValue({ id: 1 }),
        };

        Object.entries({ ...defaults, ...extraMocks }).forEach(([method, impl]) => {
            repoModule.orderRepository[method] = impl;
        });

        return repoModule.orderRepository;
    }

    // ─── 1. PAID → PROCESSING ────────────────────────────────
    describe('PAID → PROCESSING', () => {
        it('should transition successfully', async () => {
            const order = makeOrder({ status: 'PAID' });
            setupRepo(order);

            const result = await service.updateOrderStatus(makeInput({ status: 'PROCESSING' }));
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
        });

        it('should create status history with MERCHANT actor type', async () => {
            const order = makeOrder({ status: 'PAID' });
            const repo = setupRepo(order);

            await service.updateOrderStatus(makeInput({ status: 'PROCESSING' }));

            expect(repo.createOrderStatusHistory).toHaveBeenCalledWith(
                expect.objectContaining({
                    fromStatus: 'PAID',
                    toStatus: 'PROCESSING',
                    changedByType: 'MERCHANT',
                }),
                expect.anything()
            );
        });
    });

    // ─── 2. PAID → MERCHANT_CANCELED ─────────────────────────
    describe('PAID → MERCHANT_CANCELED', () => {
        it('should transition and create refund order', async () => {
            const order = makeOrder({ status: 'PAID' });
            const repo = setupRepo(order);

            await service.updateOrderStatus(
                makeInput({ status: 'MERCHANT_CANCELED', reason: 'Out of stock' })
            );

            expect(repo.createRefundOrder).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderId: 1,
                    status: 'APPROVED',
                    reason: 'Out of stock',
                    requestedBy: 'MERCHANT',
                }),
                expect.anything()
            );
        });

        it('should create refund status history', async () => {
            const order = makeOrder({ status: 'PAID' });
            const repo = setupRepo(order);

            await service.updateOrderStatus(
                makeInput({ status: 'MERCHANT_CANCELED', reason: 'Out of stock' })
            );

            expect(repo.createRefundStatusHistory).toHaveBeenCalled();
        });
    });

    // ─── 3. PROCESSING → READY_TO_SHIP ──────────────────────
    describe('PROCESSING → READY_TO_SHIP', () => {
        it('should transition and update shipping status', async () => {
            const shippingInfo: Record<string, any> = {
                id: 5,
                shippingStatus: 'PENDING',
                update: jest.fn().mockResolvedValue(true),
            };
            shippingInfo.get = (key: string) => shippingInfo[key];

            const order = makeOrder({ status: 'PROCESSING', shippingInfo });
            const repo = setupRepo(order);

            await service.updateOrderStatus(makeInput({ status: 'READY_TO_SHIP' }));

            expect(repo.updateShippingInfo).toHaveBeenCalledWith(
                shippingInfo,
                expect.objectContaining({ shippingStatus: 'READY_TO_SHIP' }),
                expect.anything()
            );
            expect(repo.createShipmentEvent).toHaveBeenCalledWith(
                expect.objectContaining({ toStatus: 'READY_TO_SHIP' }),
                expect.anything()
            );
        });

        it('should skip shipping update when shippingInfo is null', async () => {
            const order = makeOrder({ status: 'PROCESSING', shippingInfo: null });
            const repo = setupRepo(order);

            await service.updateOrderStatus(makeInput({ status: 'READY_TO_SHIP' }));

            expect(repo.updateShippingInfo).not.toHaveBeenCalled();
        });
    });

    // ─── 4. REFUND_REQUEST → REFUND_APPROVED (direct) ────────
    describe('REFUND_REQUEST → REFUND_APPROVED', () => {
        it('should update refund order status to APPROVED', async () => {
            const refund = { id: 1, orderId: 1, status: 'REQUESTED', amountMinor: 100000 };
            const order = makeOrder({ status: 'REFUND_REQUEST' });
            const repo = setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
            });

            await service.updateOrderStatus(makeInput({ status: 'REFUND_APPROVED' }));

            expect(repo.updateRefundOrder).toHaveBeenCalledWith(
                refund,
                expect.objectContaining({ status: 'APPROVED', approvedAt: expect.any(Date) }),
                expect.anything()
            );
        });

        it('should create refund status history from REQUESTED → APPROVED', async () => {
            const refund = { id: 1, orderId: 1, status: 'REQUESTED', amountMinor: 100000 };
            const order = makeOrder({ status: 'REFUND_REQUEST' });
            const repo = setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
            });

            await service.updateOrderStatus(makeInput({ status: 'REFUND_APPROVED' }));

            expect(repo.createRefundStatusHistory).toHaveBeenCalledWith(
                expect.objectContaining({
                    fromStatus: 'REQUESTED',
                    toStatus: 'APPROVED',
                }),
                expect.anything()
            );
        });
    });

    // ─── 5. REFUND_REQUEST → AWAITING_RETURN ─────────────────
    describe('REFUND_REQUEST → AWAITING_RETURN', () => {
        it('should create return shipment when order is delivered', async () => {
            const shippingInfo: Record<string, any> = {
                id: 5,
                shippingStatus: 'DELIVERED',
                address_snapshot: { street: '123 Main St' },
                update: jest.fn().mockResolvedValue(true),
            };
            shippingInfo.get = (key: string) => shippingInfo[key];

            const refund = { id: 1, orderId: 1, status: 'REQUESTED', amountMinor: 100000 };
            const order = makeOrder({ status: 'REFUND_REQUEST', shippingInfo });
            const repo = setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
                findReturnShipmentByOrderId: jest.fn().mockResolvedValue(null),
            });

            await service.updateOrderStatus(makeInput({ status: 'AWAITING_RETURN' }));

            expect(repo.createReturnShipment).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderId: 1,
                    refundOrderId: 1,
                    status: 'AWAITING_DROP',
                }),
                expect.anything()
            );
            expect(repo.createReturnShipmentEvent).toHaveBeenCalledWith(
                expect.objectContaining({ toStatus: 'AWAITING_DROP' }),
                expect.anything()
            );
        });

        it('should throw 409 when order is not delivered', async () => {
            const shippingInfo: Record<string, any> = {
                id: 5,
                shippingStatus: 'SHIPPED',
                update: jest.fn().mockResolvedValue(true),
            };
            shippingInfo.get = (key: string) => shippingInfo[key];

            const refund = { id: 1, orderId: 1, status: 'REQUESTED', amountMinor: 100000 };
            const order = makeOrder({ status: 'REFUND_REQUEST', shippingInfo });
            setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
                findReturnShipmentByOrderId: jest.fn().mockResolvedValue(null),
            });

            await expect(
                service.updateOrderStatus(makeInput({ status: 'AWAITING_RETURN' }))
            ).rejects.toThrow();
        });

        it('should throw 409 when return shipment already exists', async () => {
            const shippingInfo: Record<string, any> = {
                id: 5,
                shippingStatus: 'DELIVERED',
                update: jest.fn().mockResolvedValue(true),
            };
            shippingInfo.get = (key: string) => shippingInfo[key];

            const refund = { id: 1, orderId: 1, status: 'REQUESTED', amountMinor: 100000 };
            const existingReturn = { id: 99, status: 'AWAITING_DROP' };
            const order = makeOrder({ status: 'REFUND_REQUEST', shippingInfo });
            setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
                findReturnShipmentByOrderId: jest.fn().mockResolvedValue(existingReturn),
            });

            await expect(
                service.updateOrderStatus(makeInput({ status: 'AWAITING_RETURN' }))
            ).rejects.toThrow();
        });
    });

    // ─── 6. REFUND_REQUEST → REFUND_REJECTED ─────────────────
    describe('REFUND_REQUEST → REFUND_REJECTED', () => {
        it('should update refund status to CANCELED with reject reason', async () => {
            const refund = { id: 1, orderId: 1, status: 'REQUESTED', amountMinor: 100000 };
            const order = makeOrder({ status: 'REFUND_REQUEST' });
            const repo = setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
            });

            await service.updateOrderStatus(
                makeInput({ status: 'REFUND_REJECTED', reason: 'Item was used' })
            );

            expect(repo.updateRefundOrder).toHaveBeenCalledWith(
                refund,
                expect.objectContaining({
                    status: 'CANCELED',
                    merchantRejectReason: 'Item was used',
                }),
                expect.anything()
            );
        });
    });

    // ─── 7. RECEIVE_RETURN → RETURN_VERIFIED ─────────────────
    describe('RECEIVE_RETURN → RETURN_VERIFIED', () => {
        it('should create return shipment event when return exists', async () => {
            const returnShipment = { id: 5, status: 'DELIVERED_BACK' };
            const order = makeOrder({ status: 'RECEIVE_RETURN' });
            const repo = setupRepo(order, {
                findReturnShipmentByOrderId: jest.fn().mockResolvedValue(returnShipment),
            });

            await service.updateOrderStatus(makeInput({ status: 'RETURN_VERIFIED' }));

            expect(repo.createReturnShipmentEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    returnShipmentId: 5,
                    description: 'Merchant verified goods (RETURN_VERIFIED)',
                }),
                expect.anything()
            );
        });

        it('should create shipping event for RTS verification when no return shipment', async () => {
            const shippingInfo: Record<string, any> = {
                id: 5,
                shippingStatus: 'RETURNED_TO_SENDER',
                update: jest.fn().mockResolvedValue(true),
            };
            shippingInfo.get = (key: string) => shippingInfo[key];

            const order = makeOrder({ status: 'RECEIVE_RETURN', shippingInfo });
            const repo = setupRepo(order, {
                findReturnShipmentByOrderId: jest.fn().mockResolvedValue(null),
            });

            await service.updateOrderStatus(makeInput({ status: 'RETURN_VERIFIED' }));

            // Should create shipment event with RTS_VERIFY source
            const calls = repo.createShipmentEvent.mock.calls;
            const rtsCall = calls.find(
                (c: any[]) => c[0]?.description?.includes('RTS')
            );
            expect(rtsCall).toBeTruthy();
        });
    });

    // ─── 8. RETURN_VERIFIED → REFUND_APPROVED ────────────────
    describe('RETURN_VERIFIED → REFUND_APPROVED', () => {
        it('should approve refund after return verification', async () => {
            const refund = { id: 1, orderId: 1, status: 'REQUESTED', amountMinor: 100000 };
            const order = makeOrder({ status: 'RETURN_VERIFIED' });
            const repo = setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
            });

            await service.updateOrderStatus(makeInput({ status: 'REFUND_APPROVED' }));

            expect(repo.updateRefundOrder).toHaveBeenCalledWith(
                refund,
                expect.objectContaining({ status: 'APPROVED' }),
                expect.anything()
            );
        });
    });

    // ─── 9. REFUND_FAIL → REFUND_RETRY ───────────────────────
    describe('REFUND_FAIL → REFUND_RETRY', () => {
        it('should allow retrying a failed refund', async () => {
            const refund = { id: 1, orderId: 1, status: 'FAIL', amountMinor: 100000 };
            const order = makeOrder({ status: 'REFUND_FAIL' });
            setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
            });

            const result = await service.updateOrderStatus(
                makeInput({ status: 'REFUND_RETRY' })
            );

            expect(result).toBeDefined();
        });
    });

    // ─── 10. Terminal States ─────────────────────────────────
    describe('Terminal States', () => {
        const terminals = ['COMPLETE', 'CUSTOMER_CANCELED', 'REFUND_SUCCESS', 'RETURN_FAIL'];

        terminals.forEach((status) => {
            it(`should reject any transition from ${status}`, async () => {
                const order = makeOrder({ status });
                setupRepo(order);

                await expect(
                    service.updateOrderStatus(makeInput({ status: 'PROCESSING' }))
                ).rejects.toThrow(/terminal/i);
            });
        });
    });

    // ─── 11. Invalid Transitions ─────────────────────────────
    describe('Invalid Transitions', () => {
        const cases = [
            { from: 'PAID', to: 'DELIVERED' },
            { from: 'PAID', to: 'COMPLETE' },
            { from: 'PAID', to: 'SHIPPED' },
            { from: 'PAID', to: 'READY_TO_SHIP' },
            { from: 'PROCESSING', to: 'DELIVERED' },
            { from: 'PROCESSING', to: 'MERCHANT_CANCELED' },
            { from: 'READY_TO_SHIP', to: 'PROCESSING' },
            { from: 'REFUND_REQUEST', to: 'PROCESSING' },
            { from: 'REFUND_APPROVED', to: 'PAID' },
            { from: 'RECEIVE_RETURN', to: 'PROCESSING' },
            { from: 'RETURN_VERIFIED', to: 'PROCESSING' },
            { from: 'REFUND_FAIL', to: 'PROCESSING' },
        ];

        cases.forEach(({ from, to }) => {
            it(`should reject ${from} → ${to}`, async () => {
                const order = makeOrder({ status: from });
                setupRepo(order);

                await expect(
                    service.updateOrderStatus(makeInput({ status: to }))
                ).rejects.toThrow(/invalid transition/i);
            });
        });
    });

    // ─── 12. Service Auth Mode ───────────────────────────────
    describe('Service Auth Mode', () => {
        it('should use SYSTEM actor type when authMode is service', async () => {
            const order = makeOrder({ status: 'PAID' });
            const repo = setupRepo(order);

            await service.updateOrderStatus(
                makeInput({ status: 'PROCESSING' }, { authMode: 'service', storeId: undefined })
            );

            expect(repo.createOrderStatusHistory).toHaveBeenCalledWith(
                expect.objectContaining({
                    changedByType: 'SYSTEM',
                    source: 'SERVICE',
                }),
                expect.anything()
            );
        });
    });

    // ─── 13. Input Validation ────────────────────────────────
    describe('Input Validation', () => {
        it('should throw 400 when orderId is empty', async () => {
            await expect(
                service.updateOrderStatus(makeInput({ status: 'PROCESSING' }, { orderId: '' }))
            ).rejects.toThrow(/missing order id/i);
        });

        it('should throw 403 when non-service has no store context', async () => {
            await expect(
                service.updateOrderStatus(
                    makeInput({ status: 'PROCESSING' }, { storeId: undefined, authMode: 'user' })
                )
            ).rejects.toThrow(/store context required/i);
        });

        it('should throw 403 when order not owned by store', async () => {
            const order = makeOrder({ status: 'PAID' });
            setupRepo(order, {
                findOrderByIdAndStore: jest.fn().mockResolvedValue(0),
            });

            await expect(
                service.updateOrderStatus(makeInput({ status: 'PROCESSING' }))
            ).rejects.toThrow(/don't have access/i);
        });

        it('should throw 404 when order not found', async () => {
            setupRepo(null, {
                findOrderByIdAndStore: jest.fn().mockResolvedValue(1),
                findOrderByPkWithBaseIncludes: jest.fn().mockResolvedValue(null),
            });

            await expect(
                service.updateOrderStatus(makeInput({ status: 'PROCESSING' }))
            ).rejects.toThrow(/not found/i);
        });
    });

    // ─── 14. Transaction Management ──────────────────────────
    describe('Transaction Management', () => {
        it('should commit transaction on success', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            const order = makeOrder({ status: 'PAID' });
            setupRepo(order);

            await service.updateOrderStatus(makeInput({ status: 'PROCESSING' }));

            expect(tx.commit).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            const tx = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx);

            setupRepo(null, {
                findOrderByIdAndStore: jest.fn().mockResolvedValue(1),
                findOrderByPkWithBaseIncludes: jest.fn().mockResolvedValue(null),
            });

            await expect(
                service.updateOrderStatus(makeInput({ status: 'PROCESSING' }))
            ).rejects.toThrow();

            expect(tx.rollback).toHaveBeenCalled();
        });
    });

    // ─── 15. Shipping side effects ───────────────────────────
    describe('Shipping Status Side Effects', () => {
        it('should not update shipping for non-READY_TO_SHIP status', async () => {
            const order = makeOrder({ status: 'PAID' });
            const repo = setupRepo(order);

            await service.updateOrderStatus(makeInput({ status: 'PROCESSING' }));

            expect(repo.updateShippingInfo).not.toHaveBeenCalled();
        });
    });

    // ─── 16. Reason field ────────────────────────────────────
    describe('Reason field handling', () => {
        it('should pass reason to status history', async () => {
            const order = makeOrder({ status: 'PAID' });
            const repo = setupRepo(order);

            await service.updateOrderStatus(
                makeInput({ status: 'MERCHANT_CANCELED', reason: 'Out of stock' })
            );

            expect(repo.createOrderStatusHistory).toHaveBeenCalledWith(
                expect.objectContaining({ reason: 'Out of stock' }),
                expect.anything()
            );
        });

        it('should default reason to null when not provided', async () => {
            const order = makeOrder({ status: 'PAID' });
            const repo = setupRepo(order);

            await service.updateOrderStatus(makeInput({ status: 'PROCESSING' }));

            expect(repo.createOrderStatusHistory).toHaveBeenCalledWith(
                expect.objectContaining({ reason: null }),
                expect.anything()
            );
        });
    });

    // ─── 17. Multi-step flow ─────────────────────────────────
    describe('Full Happy Path Flow', () => {
        it('should support PAID → PROCESSING → READY_TO_SHIP sequence', async () => {
            // Step 1: PAID → PROCESSING
            const order1 = makeOrder({ status: 'PAID' });
            setupRepo(order1);
            const r1 = await service.updateOrderStatus(makeInput({ status: 'PROCESSING' }));
            expect(r1).toBeDefined();

            // Step 2: PROCESSING → READY_TO_SHIP (need new tx mock)
            const tx2 = makeTx();
            (db.sequelize.transaction as jest.Mock).mockResolvedValue(tx2);

            const shippingInfo: Record<string, any> = {
                id: 5,
                shippingStatus: 'PENDING',
                update: jest.fn().mockResolvedValue(true),
            };
            shippingInfo.get = (key: string) => shippingInfo[key];

            const order2 = makeOrder({ status: 'PROCESSING', shippingInfo });
            setupRepo(order2);
            const r2 = await service.updateOrderStatus(makeInput({ status: 'READY_TO_SHIP' }));
            expect(r2).toBeDefined();
        });
    });

    // ─── 18. Refund with prior existing refund order ─────────
    describe('Existing refund order handling', () => {
        it('should update existing refund on REFUND_APPROVED', async () => {
            const refund = { id: 1, orderId: 1, status: 'REQUESTED', amountMinor: 100000 };
            const order = makeOrder({ status: 'REFUND_REQUEST' });
            const repo = setupRepo(order, {
                findRefundOrderByOrderId: jest.fn().mockResolvedValue(refund),
            });

            await service.updateOrderStatus(makeInput({ status: 'REFUND_APPROVED' }));

            expect(repo.updateRefundOrder).toHaveBeenCalledWith(
                refund,
                expect.objectContaining({
                    status: 'APPROVED',
                    approvedAt: expect.any(Date),
                }),
                expect.anything()
            );
            expect(repo.createRefundStatusHistory).toHaveBeenCalledWith(
                expect.objectContaining({
                    fromStatus: 'REQUESTED',
                    toStatus: 'APPROVED',
                }),
                expect.anything()
            );
        });
    });
});
