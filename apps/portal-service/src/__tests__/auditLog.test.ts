import request from 'supertest';
import app from '../app';
import { auditLogService } from '../services/auditLogService';

jest.mock('../services/auditLogService');

describe('Audit Log API (Admin)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── List Audit Logs ───────────────────────────────────
    describe('GET /api/admin/audit-logs/list', () => {
        it('should return 200 and audit log list', async () => {
            (auditLogService.listAuditLogs as jest.Mock).mockResolvedValue({
                data: [
                    {
                        id: 1,
                        action: 'LOGIN',
                        adminEmail: 'admin@test.com',
                        createdAt: '2023-01-01T00:00:00Z'
                    },
                ],
                meta: { total: 1, page: 1, pageSize: 20 }
            });

            const res = await request(app)
                .get('/api/admin/audit-logs/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].action).toBe('LOGIN');
        });

        it('should pass query params to service', async () => {
            (auditLogService.listAuditLogs as jest.Mock).mockResolvedValue({
                data: [],
                meta: { total: 0 }
            });

            await request(app)
                .get('/api/admin/audit-logs/list?page=2&pageSize=10&action=DELETE')
                .set('Cookie', ['access_token=valid-token']);

            expect(auditLogService.listAuditLogs).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: '2',
                    pageSize: '10',
                    action: 'DELETE'
                })
            );
        });

        it('should return 500 when service throws', async () => {
            (auditLogService.listAuditLogs as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/audit-logs/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ── Suggest Audit Logs ────────────────────────────────
    describe('GET /api/admin/audit-logs/suggest', () => {
        it('should return 200 and suggestions', async () => {
            (auditLogService.suggestAuditLogs as jest.Mock).mockResolvedValue({
                logs: [{ id: 1, action: 'CREATE_PRODUCT' }]
            });

            const res = await request(app)
                .get('/api/admin/audit-logs/suggest?q=create')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.logs).toHaveLength(1);
        });
    });

    // ── Audit Log Detail ──────────────────────────────────
    describe('GET /api/admin/audit-logs/:id/detail', () => {
        it('should return 200 and audit log detail', async () => {
            (auditLogService.getAuditLogDetail as jest.Mock).mockResolvedValue({
                id: 1,
                action: 'LOGIN',
                adminEmail: 'admin@test.com',
                ip: '127.0.0.1',
                userAgent: 'jest-test',
                metadata: { browser: 'Chrome' },
                createdAt: '2023-01-01T00:00:00Z'
            });

            const res = await request(app)
                .get('/api/admin/audit-logs/1/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.action).toBe('LOGIN');
            expect(res.body.ip).toBe('127.0.0.1');
        });

        it('should return 500 when log not found', async () => {
            (auditLogService.getAuditLogDetail as jest.Mock).mockRejectedValue(
                new Error('NOT_FOUND')
            );

            const res = await request(app)
                .get('/api/admin/audit-logs/999/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });
});
