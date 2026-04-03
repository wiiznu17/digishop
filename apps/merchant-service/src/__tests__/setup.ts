// Mock Redis
jest.mock('../lib/redis/client', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  },
}));

// Mock Database
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: undefined as string | undefined,
};

jest.mock('@digishop/db', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
  checkDatabaseConnection: jest.fn().mockResolvedValue(true),
  initModels: jest.fn(),
  Store: {
    findOne: jest.fn().mockResolvedValue({ id: 101, status: 'APPROVED' }),
    findAll: jest.fn(),
  },
  Product: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Order: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  OrderStatusHistory: {
    create: jest.fn(),
  },
  CheckOut: {},
  User: {},
  Payment: {},
  OrderItem: {},
  ShippingInfo: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  ShipmentEvent: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  RefundOrder: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  RefundStatusHistory: {
    create: jest.fn(),
  },
  PaymentGatewayEvent: {
    create: jest.fn(),
  },
  ReturnShipment: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  ReturnShipmentEvent: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  StoreStatus: {
    APPROVED: 'APPROVED',
    PENDING: 'PENDING',
    REJECTED: 'REJECTED',
  },
  ShippingStatus: {
    PENDING: 'PENDING',
    READY_TO_SHIP: 'READY_TO_SHIP',
    RECEIVE_PARCEL: 'RECEIVE_PARCEL',
    ARRIVED_SORTING_CENTER: 'ARRIVED_SORTING_CENTER',
    OUT_SORTING_CENTER: 'OUT_SORTING_CENTER',
    ARRIVED_DESTINATION_STATION: 'ARRIVED_DESTINATION_STATION',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    DELIVERY_FAILED: 'DELIVERY_FAILED',
    TRANSIT_ISSUE: 'TRANSIT_ISSUE',
    RETURN_TO_SENDER_IN_TRANSIT: 'RETURN_TO_SENDER_IN_TRANSIT',
    RETURNED_TO_SENDER: 'RETURNED_TO_SENDER',
    RE_TRANSIT: 'RE_TRANSIT',
  },
  OrderStatus: {
    PENDING: 'PENDING',
    CUSTOMER_CANCELED: 'CUSTOMER_CANCELED',
    PAID: 'PAID',
    MERCHANT_CANCELED: 'MERCHANT_CANCELED',
    PROCESSING: 'PROCESSING',
    READY_TO_SHIP: 'READY_TO_SHIP',
    HANDED_OVER: 'HANDED_OVER',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    COMPLETE: 'COMPLETE',
    TRANSIT_LACK: 'TRANSIT_LACK',
    RE_TRANSIT: 'RE_TRANSIT',
    REFUND_REQUEST: 'REFUND_REQUEST',
    REFUND_REJECTED: 'REFUND_REJECTED',
    AWAITING_RETURN: 'AWAITING_RETURN',
    RECEIVE_RETURN: 'RECEIVE_RETURN',
    RETURN_VERIFIED: 'RETURN_VERIFIED',
    RETURN_FAIL: 'RETURN_FAIL',
    REFUND_APPROVED: 'REFUND_APPROVED',
    REFUND_PROCESSING: 'REFUND_PROCESSING',
    REFUND_SUCCESS: 'REFUND_SUCCESS',
    REFUND_FAIL: 'REFUND_FAIL',
    REFUND_RETRY: 'REFUND_RETRY',
    CANCELED_REFUND: 'CANCELED_REFUND',
  },
  RefundStatus: {
    REQUESTED: 'REQUESTED',
    APPROVED: 'APPROVED',
    SUCCESS: 'SUCCESS',
    FAIL: 'FAIL',
    CANCELED: 'CANCELED',
  },
  ReturnShipmentStatus: {
    AWAITING_DROP: 'AWAITING_DROP',
    RETURN_IN_TRANSIT: 'RETURN_IN_TRANSIT',
    RETURN_TIME_OUT: 'RETURN_TIME_OUT',
    DELIVERED_BACK: 'DELIVERED_BACK',
    RETURN_FAILED: 'RETURN_FAILED',
  },
  ActorType: {
    CUSTOMER: 'CUSTOMER',
    MERCHANT: 'MERCHANT',
    ADMIN: 'ADMIN',
    SYSTEM: 'SYSTEM',
  }
}));

// Mock JWT Verification
jest.mock('../lib/jwtVerfify', () => ({
  verifyAccess: jest.fn(),
}));

// Mock Azure Blob Service (actually Supabase now)
jest.mock('../helpers/azureBlobService', () => ({
  azureBlobService: {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
    deleteMultipleImages: jest.fn(),
    generateSignedUrl: jest.fn(),
  },
}));

process.env.JWT_ACCESS_COOKIE_NAME = 'access_token';
process.env.SESSION_PREFIX = 'usr:rt';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';
process.env.NODE_ENV = 'development'; // Enable error logging in errorHandler
process.env.CARRIER_WEBHOOK_SECRET = 'test-carrier-secret';
process.env.RETURN_CARRIER_WEBHOOK_SECRET = 'test-return-secret';

// Mock repositories that might be initialized at module level
jest.mock('../repositories/bankRepository', () => ({
  bankRepository: {
    findStoreByUserId: jest.fn(),
    findBankAccountsByStoreId: jest.fn(),
    saveBankAccount: jest.fn(),
    findBankAccountById: jest.fn(),
    deleteBankAccount: jest.fn(),
    clearDefaultBankAccounts: jest.fn(),
  }
}));
