import request from 'supertest';
import app from '../app';
import { userService } from '../services/userService';

jest.mock('../services/userService');

describe('User API (Customer)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /customer/verified-email', () => {
        it('should return 200 on success', async () => {
            (userService.sendValidateEmail as jest.Mock).mockResolvedValue({ data: true });

            const res = await request(app)
                .post('/customer/verified-email')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(200);
            expect(res.body.data).toBe(true);
        });
    });

    describe('POST /customer/register', () => {
        it('should return 200 on successful registration', async () => {
            (userService.createUser as jest.Mock).mockResolvedValue({ data: true });

            const res = await request(app)
                .post('/customer/register')
                .send({ 
                    token: 'valid-token',
                    email: 'test@example.com',
                    password: 'Password123!',
                    firstName: 'John',
                    lastName: 'Doe'
                });

            expect(res.status).toBe(200);
            expect(res.body.data).toBe(true);
        });
    });

    describe('GET /customer/detail/:id', () => {
        it('should return 200 and user detail', async () => {
            (userService.findUserDetail as jest.Mock).mockResolvedValue({
                id: 1,
                email: 'user@test.com',
                firstName: 'John'
            });

            const res = await request(app)
                .get('/customer/detail/1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(1);
        });
    });

    describe('POST /customer/address', () => {
        it('should return 200 on successful address creation', async () => {
            (userService.createAddress as jest.Mock).mockResolvedValue({ id: 1 });

            const res = await request(app)
                .post('/customer/address')
                .set('Cookie', ['access_token=valid-token'])
                .send({
                    name: 'John Doe',
                    phone: '0123456789',
                    address1: '123 Main St',
                    subdistrict: 'District',
                    district: 'City',
                    province: 'Province',
                    postalCode: '10001'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(1);
        });
    });

    describe('GET /customer/address/:id', () => {
        it('should return 200 and address list', async () => {
            (userService.findAddressUser as jest.Mock).mockResolvedValue([
                { id: 1, street: 'Main St' }
            ]);

            const res = await request(app)
                .get('/customer/address/1')
                .set('Cookie', ['access_token=valid-token']);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('PATCH /customer/name/:id', () => {
        it('should return 200 on successful name update', async () => {
            (userService.updateUserName as jest.Mock).mockResolvedValue({ data: 'success' });

            const res = await request(app)
                .patch('/customer/name/1')
                .set('Cookie', ['access_token=valid-token'])
                .send({ firstName: 'Johnny', lastName: 'Doe' });

            expect(res.status).toBe(200);
            expect(res.body.data).toBe('success');
        });
    });

    describe('POST /customer/forgot-password', () => {
        it('should return 200 on success', async () => {
            (userService.sendMailResetPassword as jest.Mock).mockResolvedValue({ data: true });

            const res = await request(app)
                .post('/customer/forgot-password')
                .send({ email: 'test@example.com' });

            expect(res.status).toBe(200);
            expect(res.body.data).toBe(true);
        });
    });

    describe('PATCH /customer/reset-password', () => {
        it('should return 200 on success', async () => {
            (userService.resetPassword as jest.Mock).mockResolvedValue({ data: 'success' });

            const res = await request(app)
                .patch('/customer/reset-password')
                .send({ token: 'reset-token', newPassword: 'NewPassword123!' });

            expect(res.status).toBe(200);
            expect(res.body.data).toBe('success');
        });
    });
});
