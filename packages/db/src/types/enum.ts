// src/models/enums.ts
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
}

export enum AddressType {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
}

export enum StoreStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BANNED = 'BANNED',
}

export enum ShippingType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum ShippingStatus {
  PROCESSING = 'PROCESSING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}