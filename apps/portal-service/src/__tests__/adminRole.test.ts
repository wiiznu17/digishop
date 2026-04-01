import request from 'supertest';
import app from '../app';
import { adminRoleService } from '../services/adminRoleService';

jest.mock('../services/adminRoleService');

describe('Admin Role API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── List Roles ────────────────────────────────────────
    describe('GET /api/admin/roles/list', () => {
        it('should return 200 and role list', async () => {
            (adminRoleService.listRoles as jest.Mock).mockResolvedValue({
                data: [
                    { id: 1, name: 'Super Admin', slug: 'SUPER_ADMIN' },
                    { id: 2, name: 'Editor', slug: 'EDITOR' },
                ],
                meta: { total: 2 }
            });

            const res = await request(app)
                .get('/api/admin/roles/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
        });

        it('should return 500 when service throws', async () => {
            (adminRoleService.listRoles as jest.Mock).mockRejectedValue(new Error('DB_ERROR'));

            const res = await request(app)
                .get('/api/admin/roles/list')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ── Role Detail ───────────────────────────────────────
    describe('GET /api/admin/roles/:id/detail', () => {
        it('should return 200 and role detail', async () => {
            (adminRoleService.getRoleDetail as jest.Mock).mockResolvedValue({
                id: 1,
                name: 'Super Admin',
                slug: 'SUPER_ADMIN',
                permissions: [
                    { id: 1, slug: 'PRODUCTS_READ', name: 'Read Products' },
                ]
            });

            const res = await request(app)
                .get('/api/admin/roles/1/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Super Admin');
            expect(res.body.permissions).toHaveLength(1);
        });

        it('should return 500 when role not found', async () => {
            (adminRoleService.getRoleDetail as jest.Mock).mockRejectedValue(new Error('NOT_FOUND'));

            const res = await request(app)
                .get('/api/admin/roles/999/detail')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(500);
        });
    });

    // ── Create Role ───────────────────────────────────────
    describe('POST /api/admin/roles/create', () => {
        it('should return 200 on create success', async () => {
            (adminRoleService.createRole as jest.Mock).mockResolvedValue({
                id: 3,
                name: 'Content Manager',
                slug: 'CONTENT_MANAGER'
            });

            const res = await request(app)
                .post('/api/admin/roles/create')
                .set('Cookie', ['access_token=valid-token'])
                .send({ name: 'Content Manager', slug: 'CONTENT_MANAGER' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Content Manager');
        });

        it('should return 500 on duplicate slug', async () => {
            (adminRoleService.createRole as jest.Mock).mockRejectedValue(new Error('DUPLICATE_SLUG'));

            const res = await request(app)
                .post('/api/admin/roles/create')
                .set('Cookie', ['access_token=valid-token'])
                .send({ name: 'Admin', slug: 'ADMIN' });

            expect(res.status).toBe(500);
        });
    });

    // ── Update Role Meta ──────────────────────────────────
    describe('PATCH /api/admin/roles/:id/meta', () => {
        it('should return 200 on meta update', async () => {
            (adminRoleService.updateRoleMeta as jest.Mock).mockResolvedValue({
                id: 1,
                name: 'Updated Name',
                description: 'Updated desc'
            });

            const res = await request(app)
                .patch('/api/admin/roles/1/meta')
                .set('Cookie', ['access_token=valid-token'])
                .send({ name: 'Updated Name', description: 'Updated desc' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Updated Name');
        });
    });

    // ── Replace Role Permissions ──────────────────────────
    describe('PUT /api/admin/roles/:id/permissions', () => {
        it('should return 200 on permission replacement', async () => {
            (adminRoleService.replaceRolePermissions as jest.Mock).mockResolvedValue({
                ok: true,
                permissionCount: 5
            });

            const res = await request(app)
                .put('/api/admin/roles/1/permissions')
                .set('Cookie', ['access_token=valid-token'])
                .send({ permissionIds: [1, 2, 3, 4, 5] });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.permissionCount).toBe(5);
        });

        it('should return 500 when role not found', async () => {
            (adminRoleService.replaceRolePermissions as jest.Mock).mockRejectedValue(
                new Error('ROLE_NOT_FOUND')
            );

            const res = await request(app)
                .put('/api/admin/roles/999/permissions')
                .set('Cookie', ['access_token=valid-token'])
                .send({ permissionIds: [1] });

            expect(res.status).toBe(500);
        });
    });
});
