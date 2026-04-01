// Mock Redis
jest.mock('../lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  },
  ensureRedis: jest.fn().mockResolvedValue(true),
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
  Store: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  Product: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  },
  Category: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  },
  Order: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  AdminUser: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  AdminRole: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  AdminSession: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  AdminUserRole: {
    findAll: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
    count: jest.fn(),
  },
  AdminPermission: {
    findAll: jest.fn(),
  },
  AdminRolePermission: {
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
  CheckOut: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  RefundOrder: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  AdminSystemLog: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
  StoreStatus: {
    APPROVED: 'APPROVED',
    PENDING: 'PENDING',
    REJECTED: 'REJECTED',
  },
  UserRole: {
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    USER: 'USER',
    MERCHANT: 'MERCHANT',
  },
  OrderStatus: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
  },
  ReturnShipmentStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  },
}));

// Mock Middlewares
jest.mock('../middlewares/auth', () => ({
  authenticateAdmin: (req: any, _res: any, next: any) => {
    req.adminId = 1;
    req.admin = { id: 1, email: 'admin@test.com', role: 'ADMIN' };
    req.sessionJti = 'test-jti';
    req.permCache = new Set(['*']);
    next();
  },
  requirePerms: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock Super Admin Middleware
jest.mock('../middlewares/requireSuperAdmin', () => ({
  requireSuperAdmin: (_req: any, _res: any, next: any) => next(),
}));



// Mock Mailer
jest.mock('../helpers/mailer', () => ({
  sendAdminInvite: jest.fn().mockResolvedValue(true),
  sendAdminReset: jest.fn().mockResolvedValue(true),
}));

// Mock JWT
jest.mock('../lib/jwt', () => ({
  signAccess: jest.fn().mockReturnValue('mock-access-jwt'),
  signRefresh: jest.fn().mockReturnValue('mock-refresh-jwt'),
  verifyAccess: jest.fn().mockReturnValue({ sub: '1', jti: 'test-jti' }),
  verifyRefresh: jest.fn().mockReturnValue({ sub: '1', jti: 'test-jti' }),
}));

// Mock tokens
jest.mock('../lib/tokens', () => ({
  generateSecureToken: jest.fn().mockReturnValue('mock-token'),
}));

// Mock password policy
jest.mock('../lib/passwordPolicy', () => ({
  validatePassword: jest.fn().mockReturnValue({ valid: true }),
  PasswordSchema: require('zod').z.string().min(8),
}));

process.env.JWT_ACCESS_COOKIE_NAME = 'access_token';
process.env.JWT_REFRESH_COOKIE_NAME = 'refresh_token';
process.env.NODE_ENV = 'test';
process.env.SESSION_PREFIX = 'adm:rt';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';
process.env.SENDGRID_API_KEY = 'mock-api-key';
