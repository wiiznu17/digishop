import { checkDatabaseConnection, sequelize } from './db';
import { Sequelize } from 'sequelize';

import { User } from '../src/models/User';
import { Address } from '../src/models/Address';
import { Store } from '../src/models/Store';
import { ShippingConfig } from '../src/models/ShippingConfig';
import { Category } from '../src/models/Category';
import { Product } from '../src/models/Product';
import { Order } from '../src/models/Order';
import { OrderItem } from '../src/models/OrderItem';
import { Payment } from '../src/models/Payment';
import { ShippingInfo } from '../src/models/ShippingInfo';
import { Review } from '../src/models/Review';
import { ProductView } from '../src/models/ProductView';
import { StoreView } from '../src/models/StoreView';
import { AdminUser } from '../src/models/portal/AdminUser';
import { AdminSystemLog } from '../src/models/portal/AdminSystemLog';
import { Dispute } from '../src/models/Dispute';
import { MerchantAddress } from '../src/models/StoreAddress';
import { ProductImage } from '../src/models/ProductImage'
import { BankAccount } from '../src/models/bank/BankAccount';
import { ShippingType } from '@models/ShippingType';
export function initModels(sequelize: Sequelize) {
  // init main
  User.initModel(sequelize);
  Address.initModel(sequelize);
  Store.initModel(sequelize);
  MerchantAddress.initModel(sequelize);
  ShippingConfig.initModel(sequelize);
  Category.initModel(sequelize);
  Product.initModel(sequelize);
  Order.initModel(sequelize);
  OrderItem.initModel(sequelize);
  Payment.initModel(sequelize);
  ShippingInfo.initModel(sequelize);
  Review.initModel(sequelize);
  ProductView.initModel(sequelize);
  StoreView.initModel(sequelize);
  AdminUser.initModel(sequelize);
  AdminSystemLog.initModel(sequelize);
  Dispute.initModel(sequelize);
  // Init bank
  BankAccount.initModel(sequelize);

  // --- Associations ---
  // User
  User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses', onDelete: 'CASCADE' });
  Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasOne(Store, { foreignKey: 'user_id', as: 'store', onDelete: 'CASCADE' });
  Store.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

  User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
  Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

  User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
  Review.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

  User.hasMany(ProductView, { foreignKey: 'user_id', as: 'productViews' });
  ProductView.belongsTo(User, { foreignKey: 'user_id', as: 'viewer' });

  User.hasMany(StoreView, { foreignKey: 'user_id', as: 'storeViews' });
  StoreView.belongsTo(User, { foreignKey: 'user_id', as: 'viewer' });

  // Store
  Store.hasMany(Product, { foreignKey: 'store_id', as: 'products' });
  Product.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

  Store.hasMany(Order, { foreignKey: 'store_id', as: 'storeOrders' });
  Order.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

  Store.hasMany(ShippingConfig, { foreignKey: 'store_id', as: 'shippingConfigs' });
  ShippingConfig.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

  Store.hasMany(StoreView, { foreignKey: 'store_id', as: 'views' });
  StoreView.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

  Store.hasMany(MerchantAddress, { foreignKey: 'user_id', as: 'addresses' });
  MerchantAddress.belongsTo(Store, { foreignKey: 'user_id', as: 'store' });

  // Category
  Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
  Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  // Product
  Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
  OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
  Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  Product.hasMany(ProductView, { foreignKey: 'product_id', as: 'views' });
  ProductView.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  Product.hasOne(Category, { foreignKey: 'id', as: 'categoryDetail' });
  Category.belongsTo(Product, { foreignKey: 'id', as: 'productCategory' });

  Product.hasMany(ProductImage, {
    foreignKey: 'productId',
    as: 'images'
  })

  ProductImage.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
  })

  // Order
  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
  OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

  Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments', onDelete: 'CASCADE' });
  Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

  Order.hasOne(ShippingInfo, { foreignKey: 'order_id', as: 'shippingInfo', onDelete: 'CASCADE' });
  ShippingInfo.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

  Order.hasMany(Dispute, { foreignKey: 'order_id', as: 'disputes', onDelete: 'CASCADE' });
  Dispute.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

  // Shipping info
  ShippingInfo.belongsTo(ShippingType, { foreignKey: 'shippingTypeId', as: 'shippingType' });
  ShippingType.hasMany(ShippingInfo, { foreignKey: 'shippingTypeId', as: 'shippingInfos' });

  // Bank account
  BankAccount.hasMany(Store, {
    foreignKey: 'bank_account_id',
    as: 'stores',
  });

  Store.belongsTo(BankAccount, {
    foreignKey: 'bank_account_id',
    as: 'bankAccount',
  });
  // Admin
  AdminUser.hasMany(AdminSystemLog, { foreignKey: 'admin_id', as: 'logs' });
  AdminSystemLog.belongsTo(AdminUser, { foreignKey: 'admin_id', as: 'admin' });

  return {
    User,
    Address,
    Store,
    MerchantAddress,
    ShippingConfig,
    Category,
    Product,
    Order,
    OrderItem,
    Payment,
    ShippingInfo,
    Review,
    ProductView,
    StoreView,
    AdminUser,
    AdminSystemLog,
    Dispute,
    BankAccount
  };
}

export { checkDatabaseConnection };
export default sequelize;
