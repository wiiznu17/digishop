import { checkDatabaseConnection, sequelize } from "./db";
import { Sequelize } from "sequelize";

// ── Core / Profile
import { User } from "../src/models/User";
import { Address } from "../src/models/Address";
import { Store } from "../src/models/Store";
import { MerchantAddress } from "../src/models/StoreAddress";
import { ProfileMerchantImage } from "../src/models/ProfileImage";
import { BankAccount } from "../src/models/bank/BankAccount";
import { ShippingConfig } from "../src/models/ShippingConfig";

// ── Catalog
import { Category } from "../src/models/Category";
import { Product } from "../src/models/Product";
import { ProductImage } from "../src/models/ProductImage";
import { ProductItemImage } from "../src/models/ProductItemImage";
// Variations / SKU
import { Variation } from "../src/models/Variation";
import { VariationOption } from "../src/models/VariationOption";
import { ProductItem } from "../src/models/ProductItem";
import { ProductConfiguration } from "../src/models/ProductConfiguration";

// ── Cart
import { ShoppingCart } from "../src/models/ShoppingCart";
import { ShoppingCartItem } from "../src/models/ShoppingCartItem";

// ── Order domain
import { Order } from "../src/models/Order";
import { OrderItem } from "../src/models/OrderItem";
import { OrderStatusHistory } from "../src/models/OrderStatusHistory";
import { ShippingType } from "../src/models/ShippingType";
import { ShippingInfo } from "../src/models/ShippingInfo";
import { Payment } from "../src/models/Payment";
import { PaymentGatewayEvent } from "../src/models/PaymentGatewayEvent";
import { RefundOrder } from "../src/models/RefundOrder";
import { RefundImage } from "../src/models/RefundImage";
import { RefundStatusHistory } from "../src/models/RefundStatusHistory";
import { Review } from "../src/models/Review";
import { Dispute } from "../src/models/Dispute";
import { CheckOut } from "../src/models/CheckOut";

// ── Analytics
import { ProductView } from "../src/models/ProductView";
import { StoreView } from "../src/models/StoreView";

// ── Admin (portal)
import { AdminUser } from "../src/models/portal/AdminUser";
import { AdminSystemLog } from "../src/models/portal/AdminSystemLog";
import { AdminSession } from "../src/models/portal/AdminSession";
import { AdminPasswordReset } from "../src/models/portal/AdminPasswordReset";
import { AdminInvite } from "../src/models/portal/AdminInvite";
import { AdminMfaFactor } from "../src/models/portal/AdminMfaFactor";
import { AdminMfaChallenge } from "../src/models/portal/AdminMfaChallenge";
import { AdminRecoveryCode } from "../src/models/portal/AdminRecoveryCode";
import { AdminRole } from "../src/models/portal/AdminRole";
import { AdminPermission } from "../src/models/portal/AdminPermission";
import { AdminRolePermission } from "../src/models/portal/AdminRolePermission";
import { AdminUserRole } from "../src/models/portal/AdminUserRole";
import { AdminApiKey } from "../src/models/portal/AdminApiKey";
import { ShipmentEvent } from "../src/models/ShipmentEvent";
import { ReturnShipment } from "../src/models/ReturnShipment";
import { ReturnShipmentEvent } from "../src/models/ReturnShipmentEvent";

export function initModels(conn: Sequelize) {
  // ── init (Core)
  User.initModel(conn);
  Address.initModel(conn);
  Store.initModel(conn);
  MerchantAddress.initModel(conn);
  // ProfileMerchantImage.initModel(conn); // ถ้าพร้อมใช้งานค่อยเปิด
  BankAccount.initModel(conn);
  ShippingConfig.initModel(conn);

  Category.initModel(conn);
  Product.initModel(conn);
  ProductImage.initModel(conn);
  ProductItemImage.initModel(conn);

  Variation.initModel(conn);
  VariationOption.initModel(conn);
  ProductItem.initModel(conn);
  ProductConfiguration.initModel(conn);

  ShoppingCart.initModel(conn);
  ShoppingCartItem.initModel(conn);

  Order.initModel(conn);
  OrderItem.initModel(conn);
  OrderStatusHistory.initModel(conn);
  ShippingType.initModel(conn);
  ShippingInfo.initModel(conn);
  Payment.initModel(conn);
  PaymentGatewayEvent.initModel(conn);
  RefundOrder.initModel(conn);
  RefundImage.initModel(conn);
  RefundStatusHistory.initModel(conn);
  Review.initModel(conn);
  Dispute.initModel(conn);
  CheckOut.initModel(conn);
  ShipmentEvent.initModel(conn);
  ReturnShipment.initModel(conn);
  ReturnShipmentEvent.initModel(conn);


  ProductView.initModel(conn);
  StoreView.initModel(conn);

  // ── init (Admin)
  AdminUser.initModel(conn);
  AdminSystemLog.initModel(conn);
  AdminSession.initModel(conn);
  AdminPasswordReset.initModel(conn);
  AdminInvite.initModel(conn);
  AdminMfaFactor.initModel(conn);
  AdminMfaChallenge.initModel(conn);
  AdminRecoveryCode.initModel(conn);
  AdminRole.initModel(conn);
  AdminPermission.initModel(conn);
  AdminRolePermission.initModel(conn);
  AdminUserRole.initModel(conn);
  AdminApiKey.initModel(conn);

  // ─────────────────────────── Associations ───────────────────────────

  // Users <-> Addresses / Store / Orders / Reviews / Views / Disputes
  User.hasMany(Address, { foreignKey: { name: "userId", field: "user_id" }, as: "addresses", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Address.belongsTo(User, { foreignKey: { name: "userId", field: "user_id" }, as: "user", onDelete: "CASCADE", onUpdate: "CASCADE" });

  User.hasOne(Store, { foreignKey: { name: "userId", field: "user_id" }, as: "store", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Store.belongsTo(User, { foreignKey: { name: "userId", field: "user_id" }, as: "owner", onDelete: "CASCADE", onUpdate: "CASCADE" });

  User.hasMany(CheckOut, { foreignKey: { name: "customerId", field: "customer_id" }, as: "checkout", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  CheckOut.belongsTo(User, { foreignKey: { name: "customerId", field: "customer_id" }, as: "customer", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  
  User.hasMany(Review, { foreignKey: { name: "userId", field: "user_id" }, as: "reviews", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Review.belongsTo(User, { foreignKey: { name: "userId", field: "user_id" }, as: "author", onDelete: "CASCADE", onUpdate: "CASCADE" });
  
  User.hasMany(ProductView, { foreignKey: { name: "userId", field: "user_id" }, as: "productViews" });
  ProductView.belongsTo(User, { foreignKey: { name: "userId", field: "user_id" }, as: "viewer" });

  User.hasMany(StoreView, { foreignKey: { name: "userId", field: "user_id" }, as: "storeViews" });
  StoreView.belongsTo(User, { foreignKey: { name: "userId", field: "user_id" }, as: "viewer" });

  User.hasMany(Dispute, { foreignKey: { name: "customerId", field: "customer_id" }, as: "disputes", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Dispute.belongsTo(User, { foreignKey: { name: "customerId", field: "customer_id" }, as: "customer", onDelete: "CASCADE", onUpdate: "CASCADE" });
  
  // Store <-> Products / Orders / Configs / Views / Addresses / ProfileImages / BankAccounts
  Store.hasMany(Product, { foreignKey: { name: "storeId", field: "store_id" }, as: "products", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Product.belongsTo(Store, { foreignKey: { name: "storeId", field: "store_id" }, as: "store", onDelete: "CASCADE", onUpdate: "CASCADE" });
  
  Store.hasMany(Order, { foreignKey: { name: "storeId", field: "store_id" }, as: "storeOrders", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  Order.belongsTo(Store, { foreignKey: { name: "storeId", field: "store_id" }, as: "store", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  
  Store.hasMany(ShippingConfig, { foreignKey: { name: "storeId", field: "store_id" }, as: "shippingConfigs", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ShippingConfig.belongsTo(Store, { foreignKey: { name: "storeId", field: "store_id" }, as: "store", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Store.hasMany(StoreView, { foreignKey: { name: "storeId", field: "store_id" }, as: "views" });
  StoreView.belongsTo(Store, { foreignKey: { name: "storeId", field: "store_id" }, as: "store" });
  
  Store.hasMany(MerchantAddress, { foreignKey: { name: "storeId", field: "store_id" }, as: "addresses", onDelete: "CASCADE", onUpdate: "CASCADE" });
  MerchantAddress.belongsTo(Store, { foreignKey: { name: "storeId", field: "store_id" }, as: "store", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Store.hasOne(ProfileMerchantImage, { foreignKey: { name: "storeId", field: "store_id" }, as: "profileImages", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ProfileMerchantImage.belongsTo(Store, { foreignKey: { name: "storeId", field: "store_id" }, as: "store", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Store.hasMany(BankAccount, { foreignKey: { name: "storeId", field: "store_id" }, as: "bankAccounts", onDelete: "CASCADE", onUpdate: "CASCADE" });
  BankAccount.belongsTo(Store, { foreignKey: { name: "storeId", field: "store_id" }, as: "store", onDelete: "CASCADE", onUpdate: "CASCADE" });

  // Category <-> Category / Product
  Category.hasMany(Category, { foreignKey: { name: "parentId", field: "parent_id" }, as: "children", onDelete: "SET NULL", onUpdate: "CASCADE" });
  Category.belongsTo(Category, { foreignKey: { name: "parentId", field: "parent_id" }, as: "parent", onDelete: "SET NULL", onUpdate: "CASCADE" });

  Category.hasMany(Product, { foreignKey: { name: "categoryId", field: "category_id" }, as: "products", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  Product.belongsTo(Category, { foreignKey: { name: "categoryId", field: "category_id" }, as: "category", onDelete: "RESTRICT", onUpdate: "CASCADE" });

  // Product <-> Images / Variations / ProductItems / Reviews / Views / OrderItems
  Product.hasMany(ProductImage, { foreignKey: { name: "productId", field: "product_id" }, as: "images", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ProductImage.belongsTo(Product, { foreignKey: { name: "productId", field: "product_id" }, as: "product", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Product.hasMany(Variation, { foreignKey: { name: "productId", field: "product_id" }, as: "variations", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Variation.belongsTo(Product, { foreignKey: { name: "productId", field: "product_id" }, as: "product", onDelete: "CASCADE", onUpdate: "CASCADE" });
  
  Variation.hasMany(VariationOption, { foreignKey: { name: "variationId", field: "variation_id" }, as: "options", onDelete: "CASCADE", onUpdate: "CASCADE" });
  VariationOption.belongsTo(Variation, { foreignKey: { name: "variationId", field: "variation_id" }, as: "variation", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Product.hasMany(ProductItem, { foreignKey: { name: "productId", field: "product_id" }, as: "items", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ProductItem.belongsTo(Product, { foreignKey: { name: "productId", field: "product_id" }, as: "product", onDelete: "CASCADE", onUpdate: "CASCADE" });

  ProductItem.hasMany(ProductConfiguration, { foreignKey: { name: "productItemId", field: "product_item_id" }, as: "configurations", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ProductConfiguration.belongsTo(ProductItem, { foreignKey: { name: "productItemId", field: "product_item_id" }, as: "productItem", onDelete: "CASCADE", onUpdate: "CASCADE" });
  
  ProductItem.hasOne(ProductItemImage, { foreignKey: { name: "productItemId", field: "product_item_id" }, as: "productItemImage", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ProductItemImage.belongsTo(ProductItem, { foreignKey: { name: "productItemId", field: "product_item_id" }, as: "productItem", onDelete: "CASCADE", onUpdate: "CASCADE" });

  VariationOption.hasMany(ProductConfiguration, { foreignKey: { name: "variationOptionId", field: "variation_option_id" }, as: "configurations", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ProductConfiguration.belongsTo(VariationOption, { foreignKey: { name: "variationOptionId", field: "variation_option_id" }, as: "variationOption", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Product.hasMany(Review, { foreignKey: { name: "productId", field: "product_id" }, as: "reviews", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Review.belongsTo(Product, { foreignKey: { name: "productId", field: "product_id" }, as: "product", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Product.hasMany(ProductView, { foreignKey: { name: "productId", field: "product_id" }, as: "views" });
  ProductView.belongsTo(Product, { foreignKey: { name: "productId", field: "product_id" }, as: "product" });
  
  Product.hasMany(OrderItem, { foreignKey: { name: "productId", field: "product_id" }, as: "orderItems", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  OrderItem.belongsTo(Product, { foreignKey: { name: "productId", field: "product_id" }, as: "product", onDelete: "RESTRICT", onUpdate: "CASCADE" });

  // Cart
  User.hasOne(ShoppingCart, { foreignKey: { name: "userId", field: "user_id" }, as: "cart", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ShoppingCart.belongsTo(User, { foreignKey: { name: "userId", field: "user_id" }, as: "user", onDelete: "CASCADE", onUpdate: "CASCADE" });

  ShoppingCart.hasMany(ShoppingCartItem, { foreignKey: { name: "cartId", field: "cart_id" }, as: "items", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ShoppingCartItem.belongsTo(ShoppingCart, { foreignKey: { name: "cartId", field: "cart_id" }, as: "cart", onDelete: "CASCADE", onUpdate: "CASCADE" });
  
  ProductItem.hasMany(ShoppingCartItem, { foreignKey: { name: "productItemId", field: "product_item_id" }, as: "cartItems", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  ShoppingCartItem.belongsTo(ProductItem, { foreignKey: { name: "productItemId", field: "product_item_id" }, as: "productItem", onDelete: "RESTRICT", onUpdate: "CASCADE" });

  // Order <-> Items / Payment / Shipping / Status / Refund / Events / Disputes / Reviews
  Order.hasMany(OrderItem, { foreignKey: { name: "orderId", field: "order_id" }, as: "items", onDelete: "CASCADE", onUpdate: "CASCADE" });
  OrderItem.belongsTo(Order, { foreignKey: { name: "orderId", field: "order_id" }, as: "order", onDelete: "CASCADE", onUpdate: "CASCADE" });

  // connect SKU if present
  ProductItem.hasMany(OrderItem, { foreignKey: { name: "productItemId", field: "product_item_id" }, as: "orderItems", onDelete: "SET NULL", onUpdate: "CASCADE" });
  OrderItem.belongsTo(ProductItem, { foreignKey: { name: "productItemId", field: "product_item_id" }, as: "productItem", onDelete: "SET NULL", onUpdate: "CASCADE" });

  CheckOut.hasOne(Payment, { foreignKey: { name: "checkoutId", field: "checkout_id" }, as: "payment", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Payment.belongsTo(CheckOut, { foreignKey: { name: "checkoutId", field: "checkout_id" }, as: "checkout", onDelete: "CASCADE", onUpdate: "CASCADE" });

  CheckOut.hasMany(Order, { foreignKey: { name: "checkoutId", field: "checkout_id" }, as: "orders", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Order.belongsTo(CheckOut, { foreignKey: { name: "checkoutId", field: "checkout_id" }, as: "checkout", onDelete: "CASCADE", onUpdate: "CASCADE" });
  
  Order.hasOne(ShippingInfo, { foreignKey: { name: "orderId", field: "order_id" }, as: "shippingInfo", onDelete: "CASCADE", onUpdate: "CASCADE" });
  ShippingInfo.belongsTo(Order, { foreignKey: { name: "orderId", field: "order_id" }, as: "order", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Order.hasMany(OrderStatusHistory, { foreignKey: { name: "orderId", field: "order_id" }, as: "statusHistory", onDelete: "CASCADE", onUpdate: "CASCADE" });
  OrderStatusHistory.belongsTo(Order, { foreignKey: { name: "orderId", field: "order_id" }, as: "order", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Order.hasMany(Dispute, { foreignKey: { name: "orderId", field: "order_id" }, as: "disputes", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Dispute.belongsTo(Order, { foreignKey: { name: "orderId", field: "order_id" }, as: "order", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Order.hasMany(Review, { foreignKey: { name: "orderId", field: "order_id" }, as: "orderReviews", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Review.belongsTo(Order, { foreignKey: { name: "orderId", field: "order_id" }, as: "order", onDelete: "CASCADE", onUpdate: "CASCADE" });

  // Refund
  Order.hasMany(RefundOrder, { foreignKey: { name: "orderId", field: "order_id" }, as: "refundOrders", onDelete: "CASCADE", onUpdate: "CASCADE" });
  RefundOrder.belongsTo(Order, { foreignKey: { name: "orderId", field: "order_id" }, as: "order", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Payment.hasMany(RefundOrder, { foreignKey: { name: "paymentId", field: "payment_id" }, as: "refunds", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  RefundOrder.belongsTo(Payment, { foreignKey: { name: "paymentId", field: "payment_id" }, as: "payment", onDelete: "RESTRICT", onUpdate: "CASCADE" });

  RefundOrder.hasMany(RefundImage, { foreignKey: { name: "refundOrderId", field: "refund_order_id" }, as: "images", onDelete: "CASCADE", onUpdate: "CASCADE" });
  RefundImage.belongsTo(RefundOrder, { foreignKey: { name: "refundOrderId", field: "refund_order_id" }, as: "refundOrder", onDelete: "CASCADE", onUpdate: "CASCADE" });

  RefundOrder.hasMany(RefundStatusHistory, { foreignKey: { name: "refundOrderId", field: "refund_order_id" }, as: "statusHistory", onDelete: "CASCADE", onUpdate: "CASCADE" });
  RefundStatusHistory.belongsTo(RefundOrder, { foreignKey: { name: "refundOrderId", field: "refund_order_id" }, as: "refundOrder", onDelete: "CASCADE", onUpdate: "CASCADE" });

  // ShippingInfo <-> ShippingType / Address
  ShippingInfo.belongsTo(ShippingType, { foreignKey: { name: "shippingTypeId", field: "shipping_type_id" }, as: "shippingType", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  ShippingType.hasMany(ShippingInfo, { foreignKey: { name: "shippingTypeId", field: "shipping_type_id" }, as: "shippingInfos", onDelete: "RESTRICT", onUpdate: "CASCADE" });

  ShippingInfo.belongsTo(Address, { as: "address", foreignKey: { name: "shippingAddress", field: "shipping_address" }, targetKey: "id", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  Address.hasMany(ShippingInfo, { as: "shippingInfos", foreignKey: { name: "shippingAddress", field: "shipping_address" }, onDelete: "RESTRICT", onUpdate: "CASCADE" });

  // ShippingInfo ↔ ShipmentEvent (1:N)
  ShippingInfo.hasMany(ShipmentEvent, {
    foreignKey: { name: "shippingInfoId", field: "shipping_info_id" },
    as: "events",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  ShipmentEvent.belongsTo(ShippingInfo, {
    foreignKey: { name: "shippingInfoId", field: "shipping_info_id" },
    as: "shippingInfo",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Order ↔ ReturnShipment (1:N)  หนึ่งออเดอร์อาจมีหลายรอบคืน (รอบละ 1 shipment)
  Order.hasMany(ReturnShipment, {
    foreignKey: { name: "orderId", field: "order_id" },
    as: "returnShipments",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  ReturnShipment.belongsTo(Order, {
    foreignKey: { name: "orderId", field: "order_id" },
    as: "order",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // ReturnShipment ↔ ReturnShipmentEvent (1:N)
  ReturnShipment.hasMany(ReturnShipmentEvent, {
    foreignKey: { name: "returnShipmentId", field: "return_shipment_id" },
    as: "events",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  ReturnShipmentEvent.belongsTo(ReturnShipment, {
    foreignKey: { name: "returnShipmentId", field: "return_shipment_id" },
    as: "returnShipment",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // ReturnShipment ↔ RefundOrder (N:1) ถ้ามีการผูกกับคำขอเงินคืน
  ReturnShipment.belongsTo(RefundOrder, {
    foreignKey: { name: "refundOrderId", field: "refund_order_id" },
    as: "refundOrder",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  RefundOrder.hasMany(ReturnShipment, {
    foreignKey: { name: "refundOrderId", field: "refund_order_id" },
    as: "returnShipments",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  // PaymentGatewayEvent
  CheckOut.hasOne(PaymentGatewayEvent, { foreignKey: { name: "checkoutId", field: "checkout_id" }, as: "gatewayEvents", onDelete: "CASCADE", onUpdate: "CASCADE" });
  PaymentGatewayEvent.belongsTo(Order, { foreignKey: { name: "checkoutId", field: "checkout_id" }, as: "order", onDelete: "CASCADE", onUpdate: "CASCADE" });

  Payment.hasMany(PaymentGatewayEvent, { foreignKey: { name: "paymentId", field: "payment_id" }, as: "gatewayEvents", onDelete: "CASCADE", onUpdate: "CASCADE" });
  PaymentGatewayEvent.belongsTo(Payment, { foreignKey: { name: "paymentId", field: "payment_id" }, as: "payment", onDelete: "CASCADE", onUpdate: "CASCADE" });

  RefundOrder.hasMany(PaymentGatewayEvent, { foreignKey: { name: "refundOrderId", field: "refund_order_id" }, as: "gatewayEvents", onDelete: "SET NULL", onUpdate: "CASCADE" });
  PaymentGatewayEvent.belongsTo(RefundOrder, { foreignKey: { name: "refundOrderId", field: "refund_order_id" }, as: "refundOrder", onDelete: "SET NULL", onUpdate: "CASCADE" });

  // ── Admin: User ↔ Sessions / Resets / Invites / MFA / Recovery / API Keys / Logs
  AdminUser.hasMany(AdminSession, { foreignKey: { name: "adminId", field: "admin_id" }, as: "sessions", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminSession.belongsTo(AdminUser, { foreignKey: { name: "adminId", field: "admin_id" }, as: "admin", onDelete: "CASCADE", onUpdate: "CASCADE" });

  AdminUser.hasMany(AdminPasswordReset, { foreignKey: { name: "adminId", field: "admin_id" }, as: "passwordResets", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminPasswordReset.belongsTo(AdminUser, { foreignKey: { name: "adminId", field: "admin_id" }, as: "admin", onDelete: "CASCADE", onUpdate: "CASCADE" });

  AdminUser.hasMany(AdminInvite, { foreignKey: { name: "invitedByAdminId", field: "invited_by_admin_id" }, as: "invites", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  AdminInvite.belongsTo(AdminUser, { foreignKey: { name: "invitedByAdminId", field: "invited_by_admin_id" }, as: "invitedBy", onDelete: "RESTRICT", onUpdate: "CASCADE" });

  AdminUser.hasMany(AdminMfaFactor, { foreignKey: { name: "adminId", field: "admin_id" }, as: "mfaFactors", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminMfaFactor.belongsTo(AdminUser, { foreignKey: { name: "adminId", field: "admin_id" }, as: "admin", onDelete: "CASCADE", onUpdate: "CASCADE" });

  AdminUser.hasMany(AdminMfaChallenge, { foreignKey: { name: "adminId", field: "admin_id" }, as: "mfaChallenges", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminMfaChallenge.belongsTo(AdminUser, { foreignKey: { name: "adminId", field: "admin_id" }, as: "admin", onDelete: "CASCADE", onUpdate: "CASCADE" });

  AdminUser.hasMany(AdminRecoveryCode, { foreignKey: { name: "adminId", field: "admin_id" }, as: "recoveryCodes", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminRecoveryCode.belongsTo(AdminUser, { foreignKey: { name: "adminId", field: "admin_id" }, as: "admin", onDelete: "CASCADE", onUpdate: "CASCADE" });

  AdminUser.hasMany(AdminApiKey, { foreignKey: { name: "adminId", field: "admin_id" }, as: "apiKeys", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminApiKey.belongsTo(AdminUser, { foreignKey: { name: "adminId", field: "admin_id" }, as: "admin", onDelete: "CASCADE", onUpdate: "CASCADE" });

  AdminUser.hasMany(AdminSystemLog, { foreignKey: { name: "adminId", field: "admin_id" }, as: "logs", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminSystemLog.belongsTo(AdminUser, { foreignKey: { name: "adminId", field: "admin_id" }, as: "admin", onDelete: "CASCADE", onUpdate: "CASCADE" });

  // ── Admin: Roles ↔ Permissions (M:N) + join tables
  AdminRole.belongsToMany(AdminPermission, {
    through: AdminRolePermission,
    foreignKey: { name: "roleId", field: "role_id" },
    otherKey: { name: "permissionId", field: "permission_id" },
    as: "permissions",
  });
  AdminPermission.belongsToMany(AdminRole, {
    through: AdminRolePermission,
    foreignKey: { name: "permissionId", field: "permission_id" },
    otherKey: { name: "roleId", field: "role_id" },
    as: "roles",
  });

  AdminRole.hasMany(AdminRolePermission, { foreignKey: { name: "roleId", field: "role_id" }, as: "rolePermissions", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminRolePermission.belongsTo(AdminRole, { foreignKey: { name: "roleId", field: "role_id" }, as: "role", onDelete: "CASCADE", onUpdate: "CASCADE" });

  AdminPermission.hasMany(AdminRolePermission, { foreignKey: { name: "permissionId", field: "permission_id" }, as: "permissionRoles", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminRolePermission.belongsTo(AdminPermission, { foreignKey: { name: "permissionId", field: "permission_id" }, as: "permission", onDelete: "CASCADE", onUpdate: "CASCADE" });

  // ── Admin: Users ↔ Roles (M:N)
  AdminUser.belongsToMany(AdminRole, {
    through: AdminUserRole,
    foreignKey: { name: "adminId", field: "admin_id" },
    otherKey: { name: "roleId", field: "role_id" },
    as: "roles",
  });
  AdminRole.belongsToMany(AdminUser, {
    through: AdminUserRole,
    foreignKey: { name: "roleId", field: "role_id" },
    otherKey: { name: "adminId", field: "admin_id" },
    as: "admins",
  });

  AdminUser.hasMany(AdminUserRole, { foreignKey: { name: "adminId", field: "admin_id" }, as: "userRoles", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminUserRole.belongsTo(AdminUser, { foreignKey: { name: "adminId", field: "admin_id" }, as: "admin", onDelete: "CASCADE", onUpdate: "CASCADE" });

  AdminRole.hasMany(AdminUserRole, { foreignKey: { name: "roleId", field: "role_id" }, as: "userRoles", onDelete: "CASCADE", onUpdate: "CASCADE" });
  AdminUserRole.belongsTo(AdminRole, { foreignKey: { name: "roleId", field: "role_id" }, as: "role", onDelete: "CASCADE", onUpdate: "CASCADE" });

  return {
    // Core
    User, Address, Store, MerchantAddress, ProfileMerchantImage, BankAccount, ShippingConfig,
    // Catalog
    Category, Product, ProductImage,
    Variation, VariationOption, ProductItem, ProductConfiguration, ProductItemImage,
    // Cart
    ShoppingCart, ShoppingCartItem,
    // Order
    Order, OrderItem, OrderStatusHistory, ShippingType, ShippingInfo, Payment, PaymentGatewayEvent,
    RefundOrder, RefundImage, RefundStatusHistory, Review, Dispute, CheckOut, ShipmentEvent, ReturnShipment, ReturnShipmentEvent, 
    // Analytics
    ProductView, StoreView,
    // Admin
    AdminUser, AdminSystemLog, AdminSession, AdminPasswordReset, AdminInvite,
    AdminMfaFactor, AdminMfaChallenge, AdminRecoveryCode,
    AdminRole, AdminPermission, AdminRolePermission, AdminUserRole,
    AdminApiKey,
  };
}

// export { checkDatabaseConnection };
// export default sequelize;

export { sequelize, checkDatabaseConnection } from "./db";
export {
  // Core
  User,
  Address,
  Store,
  MerchantAddress,
  ProfileMerchantImage,
  BankAccount,
  ShippingConfig,

  // Catalog
  Category,
  Product,
  ProductImage,
  ProductItemImage,
  Variation,
  VariationOption,
  ProductItem,
  ProductConfiguration,

  // Cart
  ShoppingCart,
  ShoppingCartItem,

  // Order domain
  Order,
  OrderItem,
  OrderStatusHistory,
  ShippingType,
  ShippingInfo,
  Payment,
  PaymentGatewayEvent,
  RefundOrder,
  RefundImage,
  RefundStatusHistory,
  Review,
  Dispute,
  CheckOut,
  ShipmentEvent,
  ReturnShipment,
  ReturnShipmentEvent,

  // Analytics
  ProductView,
  StoreView,

  // Admin (portal)
  AdminUser,
  AdminSystemLog,
  AdminSession,
  AdminPasswordReset,
  AdminInvite,
  AdminMfaFactor,
  AdminMfaChallenge,
  AdminRecoveryCode,
  AdminRole,
  AdminPermission,
  AdminRolePermission,
  AdminUserRole,
  AdminApiKey,
};
