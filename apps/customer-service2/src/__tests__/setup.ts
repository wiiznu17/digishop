// Mock Redis
jest.mock('../lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  },
}));

// Mock Database
jest.mock('@digishop/db', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
    transaction: jest.fn().mockImplementation(async (cb: any) => {
      const t = { commit: jest.fn(), rollback: jest.fn() };
      if (cb) return cb(t);
      return t;
    }),
    query: jest.fn().mockResolvedValue([]),
  },
  checkDatabaseConnection: jest.fn().mockResolvedValue(true),
  initModels: jest.fn(),
  User: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  },
  Address: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Product: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  Order: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  OrderItem: {
    create: jest.fn(),
    bulkCreate: jest.fn(),
  },
  Cart: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  UserRole: {
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    USER: 'USER',
    MERCHANT: 'MERCHANT',
    CUSTOMER: 'CUSTOMER',
    SERVICE: 'SERVICE',
  },
}));

// Mock JWT Verify
jest.mock('../lib/jwtVerify', () => ({
  verifyAccess: jest.fn().mockReturnValue({ sub: '1', jti: 'test-jti', role: 'CUSTOMER' }),
}));

// Mock JWT
jest.mock('../util/jwt', () => ({
  accessToken: jest.fn().mockReturnValue('mock-access-token'),
}));

// Mock Mail Utility
jest.mock('../util/mailUtil', () => ({
  sendMailVerified: jest.fn().mockResolvedValue(true),
  sendMailForgotPassword: jest.fn().mockResolvedValue(true),
}));

// Mock Middlewares
jest.mock('../middlewares/middleware', () => {
    const original = jest.requireActual('../middlewares/middleware');
    return {
        ...original,
        authenticate: (req: any, _res: any, next: any) => {
            req.user = { id: 1, sub: 1, email: 'user@test.com', role: 'CUSTOMER' };
            next();
        },
        requireApprovedUser: () => (req: any, _res: any, next: any) => {
            req.user = { id: 1, sub: 1, email: 'user@test.com', role: 'CUSTOMER' };
            next();
        },
    };
});

process.env.JWT_ACCESS_COOKIE_NAME = 'access_token';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.SESSION_PREFIX = 'sess';
process.env.WEBSITE_CUSTOMER_URL = 'http://localhost:3000';
