import {
    OrderStatus,
    PaymentMethod,
    RefundStatus
} from "../../../../../packages/db/src/types/enum";
import { Address } from "./addressProp";
import { Configurations, ProductItemImages, Store } from "./productProp";
//ข้อมูลการจ่ายเงิน ที่อยู่จัดส่ง ก่อนจ่ายเงิน
export interface OrderDetail {
  id: number;
  order_code: string;
  reference: string;
  status: string;
  grand_total_minor: number;
  subtotal_minor:number
  shipping_fee_minor:number
  discount_total_minor:number
  created_at: string ;
  timeStamp?: number
  currency_code: string
  checkout: CheckOut
  createdAt?: Date;
  shippingInfo: {
    id: number;
    address: Address;
    shippingType: Shipping
  };
  items: [
    {
      quantity: number;
      unitPriceMinor: number;
      lineTotalMinor: number
      productItem: ProductItemProps;
      productNameSnapshot: string
    },
  ];
  refundOrders: CancelProp[]
}
// 
export interface Orders {
  id: number;
  reference: string;
  status: OrderStatus;
  grand_total_minor: number;
  currency_code: string //อย่าลืมเพิ่มอันอื่น
  items: [
    {
      quantity: number;
      unit_price_minor: number;
      product: {
        name: string;
        images : [
            {
                url: string
                blobName: string
                fileName: string
            }
        ],
        store: {
          storeName: string;
        };
      };
    },
  ],
  checkout: {
    id: number
    orderCode: string
    payment: {
      urlRedirect: string;
    };
  }
}
export interface OrderIdProp {
  customerId: number;
  orderData: ShoppingDetail[];
}
export interface ShoppingCartProps {
  customerId: number;
  productItemId: number[];
  quantity: number[];
}
// export interface Order1 {
//     pruductId: string,
//     userId: string
// }
export interface Order {
  orderCode: string;
  customerId: number;
  orderNote?: string;
  paymentMethod: PaymentMethod | string;
  productprice: number,
  shippingfee: number,
  shippingTypeId: number;
  shippingAddress: number;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface ShoppingDetail {
  id?: number;
  cartId?: number;
  productItemId: number;
  quantity: number;
  // unitprice ใช้จากตาราง productItem
  discountMinor: number;
  lineTotalMinor: number;
  productItem: ProductItemProps;
}

export interface ProductItemProps {
  id?: number;
  productId: number;
  sku: string;
  stockQuantity: number;
  priceMinor: number;
  image_url?: string | undefined;
  configurations: Configurations[]
  productItemImage?: ProductItemImages
  product: {
    id: number;
    uuid: string;
    name: string;
    description: string;
    storeId: number;
    store: Store;
  };
}


export interface OrderItemDetail {
  items: [
    {
      quantity: number;
      unit_price_minor: number;
      productItem: ProductItemProps;
    },
  ];
}

export interface Shipping {
  id?: number;
  name: string;
  description?: string;
  estimatedDays: number;
  price: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CheckOut {
  id:number
  orderCode: string
  payment? : Payment
}
export interface Payment {
  id: number
  url_redirect: string
  pgw_status: string
  payment_method: string
  updated_at: Date
  expiryAt: string
  providerRef: string
  paidAt?: Date;
  createdAt?: Date;
}
//order before paid

export interface CancelProp {
  id?: number
  reason: string;
  description?: string;
  status?: RefundStatus;
  url?: string
  contactEmail: string
  createdAt?: Date;
}
export interface OrderCard {
  item: OrderDetail;
  handleShowDetail: (item: OrderDetail) => void;
  selectShowDetail: OrderDetail | undefined;
}

export interface CancelRefundProps {
  shown : boolean
  id: number|undefined
}