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
jest.mock('@digishop/db', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
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
  },
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
    READY_TO_SHIP: 'READY_TO_SHIP',
    HANDED_OVER: 'HANDED_OVER',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    TRANSIT_LACK: 'TRANSIT_LACK',
    RE_TRANSIT: 'RE_TRANSIT',
    AWAITING_RETURN: 'AWAITING_RETURN',
    RECEIVE_RETURN: 'RECEIVE_RETURN',
    RETURN_FAIL: 'RETURN_FAIL',
  },
  ReturnShipmentStatus: {
    AWAITING_DROP: 'AWAITING_DROP',
    RETURN_IN_TRANSIT: 'RETURN_IN_TRANSIT',
    RETURN_TIME_OUT: 'RETURN_TIME_OUT',
    DELIVERED_BACK: 'DELIVERED_BACK',
    RETURN_FAILED: 'RETURN_FAILED',
  },
  ActorType: {
    SYSTEM: 'SYSTEM',
    USER: 'USER',
    MERCHANT: 'MERCHANT',
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
