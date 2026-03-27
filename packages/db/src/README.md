### for other way

```sh
import { Sequelize } from 'sequelize';
import { sequelize } from './db';
import { checkDatabaseConnection } from './db';

// นำเข้า init ของทุกโมเดล
import { initUser, User } from './models/user';
import { initAddress, Address } from './models/address';
import { initStore, Store } from './models/store';
import { initShippingConfig, ShippingConfig } from './models/shippingConfig';
import { initProduct, Product } from './models/product';
import { initCategory, Category } from './models/category';
import { initOrder, Order } from './models/order';
import { initOrderItem, OrderItem } from './models/orderItem';
import { initPayment, Payment } from './models/payment';
import { initShippingInfo, ShippingInfo } from './models/shippingInfo';
import { initReview, Review } from './models/review';
import { initProductView, ProductView } from './models/productView';
import { initStoreView, StoreView } from './models/storeView';
import { initAdminUser, AdminUser } from './models/adminUser';
import { initAdminSystemLog, AdminSystemLog } from './models/adminSystemLog';
import { initDispute, Dispute } from './models/dispute';

export interface DB {
  sequelize: Sequelize;
  User: typeof User;
  Address: typeof Address;
  Store: typeof Store;
  ShippingConfig: typeof ShippingConfig;
  Product: typeof Product;
  Category: typeof Category;
  Order: typeof Order;
  OrderItem: typeof OrderItem;
  Payment: typeof Payment;
  ShippingInfo: typeof ShippingInfo;
  Review: typeof Review;
  ProductView: typeof ProductView;
  StoreView: typeof StoreView;
  AdminUser: typeof AdminUser;
  AdminSystemLog: typeof AdminSystemLog;
  Dispute: typeof Dispute;
}

const db: DB = {
  sequelize,
  User: initUser(sequelize),
  Address: initAddress(sequelize),
  Store: initStore(sequelize),
  ShippingConfig: initShippingConfig(sequelize),
  Product: initProduct(sequelize),
  Category: initCategory(sequelize),
  Order: initOrder(sequelize),
  OrderItem: initOrderItem(sequelize),
  Payment: initPayment(sequelize),
  ShippingInfo: initShippingInfo(sequelize),
  Review: initReview(sequelize),
  ProductView: initProductView(sequelize),
  StoreView: initStoreView(sequelize),
  AdminUser: initAdminUser(sequelize),
  AdminSystemLog: initAdminSystemLog(sequelize),
  Dispute: initDispute(sequelize),
};

// รัน associate ถ้ามี
Object.values(db).forEach((model: any) => {
  if (model && 'associate' in model && typeof model.associate === 'function') {
    model.associate(db);
  }
});

export { checkDatabaseConnection };
export default db;

```
