import request from 'supertest';
import app from '../app';
import { adminUserService } from '../services/adminUserService';
import { adminCredentialService } from '../services/adminCredentialService';
import { changeRoleService } from '../services/changeRoleService';

jest.mock('../services/adminUserService');
jest.mock('../services/adminCredentialService');
jest.mock('../services/changeRoleService');

describe('Admin User API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── List ──────────────────────────────────────────────
    describe('GET /api/admin/admins/list', () => {
        it('should return 200 and admin list', async () => {
            (adminUserService.listAdmins as jest.Mock).mockResolvedValue({
                data: [{ id: 1, email: 'admin1@test.com', name: 'Admin 1' }],
                meta: { total: 1, page: 1, pageSize: 20 }
            });

            const res = await request(app)
                .get('/api/admin/admins/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.meta.total).toBe(1);
        });

        it('should return 500 when service throws', async () => {
            (adminUserService.listAdmins as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/admins/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ── Suggest ───────────────────────────────────────────
    describe('GET /api/admin/admins/suggest', () => {
        it('should return 200 and admin suggestions', async () => {
            (adminUserService.suggestAdmins as jest.Mock).mockResolvedValue({
                admins: [{ id: 1, email: 'admin@test.com' }]
            });

            const res = await request(app)
                .get('/api/admin/admins/suggest?q=admin')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.admins).toHaveLength(1);
        });
    });

    // ── Detail ────────────────────────────────────────────
    describe('GET /api/admin/admins/:id/detail', () => {
        it('should return 200 and admin detail', async () => {
            (adminUserService.getAdminDetail as jest.Mock).mockResolvedValue({
                id: 1,
                email: 'admin@test.com',
                name: 'Admin One',
                roles: [{ id: 1, name: 'Super Admin' }]
            });

            const res = await request(app)
                .get('/api/admin/admins/1/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.email).toBe('admin@test.com');
            expect(res.body.roles).toHaveLength(1);
        });

        it('should return 500 when admin not found', async () => {
            (adminUserService.getAdminDetail as jest.Mock).mockRejectedValue(new Error('NOT_FOUND'));

            const res = await request(app)
                .get('/api/admin/admins/999/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ── Create ────────────────────────────────────────────
    describe('POST /api/admin/admins/create', () => {
        it('should return 200 on create success', async () => {
            (adminUserService.createAdmin as jest.Mock).mockResolvedValue({
                id: 2,
                email: 'newadmin@test.com',
                name: 'New Admin'
            });

            const res = await request(app)
                .post('/api/admin/admins/create')
                .set('Cookie', ['access_token=valid-token'])
                .send({ email: 'newadmin@test.com', name: 'New Admin' });

            expect(res.status).toBe(200);
            expect(res.body.email).toBe('newadmin@test.com');
        });

        it('should return 500 on duplicate email', async () => {
            (adminUserService.createAdmin as jest.Mock).mockRejectedValue(new Error('DUPLICATE_EMAIL'));

            const res = await request(app)
                .post('/api/admin/admins/create')
                .set('Cookie', ['access_token=valid-token'])
                .send({ email: 'existing@test.com', name: 'Dup' });

            expect(res.status).toBe(500);
        });
    });

    // ── Roles list (from changeRoleController) ────────────
    describe('GET /api/admin/admins/roles/list', () => {
        it('should return 200 and roles', async () => {
            (changeRoleService.listRoles as jest.Mock).mockResolvedValue({
                roles: [{ id: 1, name: 'Admin', slug: 'ADMIN' }]
            });

            const res = await request(app)
                .get('/api/admin/admins/roles/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.roles).toHaveLength(1);
        });
    });

    // ── Update admin roles ────────────────────────────────
    describe('PATCH /api/admin/admins/:id/roles', () => {
        it('should return 200 on role update', async () => {
            (changeRoleService.updateAdminRoles as jest.Mock).mockResolvedValue({
                ok: true
            });

            const res = await request(app)
                .patch('/api/admin/admins/1/roles')
                .set('Cookie', ['access_token=valid-token'])
                .send({ roleIds: [1, 2] });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    // ── Invite ────────────────────────────────────────────
    describe('POST /api/admin/admins/:id/invite', () => {
        it('should return 200 on invite sent', async () => {
            (adminCredentialService.sendInviteById as jest.Mock).mockResolvedValue({
                ok: true,
                message: 'Invite sent'
            });

            const res = await request(app)
                .post('/api/admin/admins/1/invite')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });

        it('should return 500 when admin not found', async () => {
            (adminCredentialService.sendInviteById as jest.Mock).mockRejectedValue(
                new Error('ADMIN_NOT_FOUND')
            );

            const res = await request(app)
                .post('/api/admin/admins/999/invite')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ── Reset Password ────────────────────────────────────
    describe('POST /api/admin/admins/:id/reset-password', () => {
        it('should return 200 on reset link sent', async () => {
            (adminCredentialService.resetPasswordById as jest.Mock).mockResolvedValue({
                ok: true,
                message: 'Reset link sent'
            });

            const res = await request(app)
                .post('/api/admin/admins/1/reset-password')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });
});
