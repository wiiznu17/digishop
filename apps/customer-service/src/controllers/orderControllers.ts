import { Address } from "@digishop/db/src/models/Address";
import { Order } from "@digishop/db/src/models/Order";
import { OrderItem } from "@digishop/db/src/models/OrderItem";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { Payment } from "@digishop/db/src/models/Payment";
import { PaymentGatewayEvent } from "@digishop/db/src/models/PaymentGatewayEvent";
import { Product } from "@digishop/db/src/models/Product";
import { ProductImage } from "@digishop/db/src/models/ProductImage";
import { ProductItem } from "@digishop/db/src/models/ProductItem";
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo";
import { ShippingType } from "@digishop/db/src/models/ShippingType";
import { ShoppingCart } from "@digishop/db/src/models/ShoppingCart";
import { ShoppingCartItem } from "@digishop/db/src/models/ShoppingCartItem";
import { Store } from "@digishop/db/src/models/Store";
import { User } from "@digishop/db/src/models/User";
import { CheckOut } from "@digishop/db/src/models/CheckOut";
import {
  ActorType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  ShippingStatus,
} from "@digishop/db/src/types/enum";
import axios from "axios";
import { count } from "console";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { Op, where } from "sequelize";
import { RefundOrder } from "@digishop/db/src/models/RefundOrder";
import { RefundStatusHistory } from "@digishop/db/src/models/RefundStatusHistory";
import { RefundImage } from "@digishop/db/src/models/RefundImage";
import { ProductConfiguration } from "@digishop/db/src/models/ProductConfiguration";
import { VariationOption } from "@digishop/db/src/models/VariationOption";
import { Variation } from "@digishop/db/src/models/Variation";
import sequelize from "@digishop/db";
import { addDays, differenceInDays } from "date-fns";
import { OrderPolicy } from "@digishop/configs/orderPolicy"
import { enqueueAutoCancel } from "../queues/cancelQueue";
const signKey =
  process.env.MERCHANRT_SIGN_KEY ??
  "5LxvCzMEgCYb6kv+v23M3D1d4lnOHE1CiuA+uO8QTpM=";
const midCard = process.env.MERCHANRT_MID_CARD ?? "0691001119";
const midQR30 = process.env.MERCHANRT_MID_QR30 ?? "1772438656";
const apiId =
  process.env.MERCHANRT_API_ID ?? "Etx4MmvXsHf9JeJ3ScaLqWrgWgnwUIGSwz_n_mF9q2w";
const apiKey =
  process.env.MERCHANRT_API_KEY ??
  "ApFbpLSXApOHFB2fTlqn0zWg3HjqucQVChYmxtpOarw";
const partnerId = process.env.MERCHANRT_PARTNER_ID ?? "1754627921";

const contentSignature = (body: Object) => {
  console.log("sign key", String(signKey));
  const hmac = crypto.createHmac(
    "sha256",
    Buffer.from(String(signKey), "base64")
  );
  return hmac.update(JSON.stringify(body)).digest("base64");
};

export const findOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id, userId } = req.params;
  try {
    const getOrders = await Order.findAll({
      attributes: [
        "id",
        "reference",
        "status",
        "created_at",
        "subtotal_minor",
        "shipping_fee_minor",
        "discount_total_minor",
        "grand_total_minor",
        "currency_code",
        "order_note",
      ],
      include: [
        {
          model: CheckOut,
          as: "checkout",
          where: {
            [Op.and]: {
              customerId: userId,
              orderCode: id
            },
          },
          include: [
            {
              model: Payment,
              as: "payment",
              attributes: ["id", "url_redirect","expiry_at" ,"pgw_status", "payment_method", "updated_at"],
            },
          ],
        },
        {
          model: ShippingInfo,
          as: "shippingInfo",
          attributes: ["id"],
          include: [
            {
              model: Address,
              as: "address",
            },
            {
              model: ShippingType,
              as: "shippingType",
              attributes: ["name", "description", "estimatedDays", "price"],
            },
          ],
        },
        {
          model: OrderItem,
          as: "items",
          // attributes: ["quantity", "unit_price_minor","line_total_minor","discount_minor"],
          include: [
            {
              model: ProductItem,
              as: "productItem",
              include: [
                {
                  model: ProductConfiguration,
                  as: "configurations",
                  include: [
                    {
                      model: VariationOption,
                      as: "variationOption",
                      include: [
                        {
                          model: Variation,
                          as: "variation",
                        },
                      ],
                    },
                  ],
                },
                {
                  model: Product,
                  as: "product",
                  include: [
                    {
                      model: Store,
                      as: "store",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    return res.status(200).json({ body: getOrders });
  } catch (error) {
    console.log("error", error);
  }
};
export const findUserOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  try {
    const getUserOrders = await Order.findAndCountAll({
      attributes: [
        "id",
        "reference",
        "status",
        "currency_code",
        "order_note",
        "grand_total_minor",
        "subtotal_minor",
        "shipping_fee_minor",
        "discount_total_minor",
        "created_at",
      ],
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: ProductItem,
              as: "productItem",
              include: [
                {
                  model: ProductConfiguration,
                  as: "configurations",
                  include: [
                    {
                      model: VariationOption,
                      as: "variationOption",
                      include: [
                        {
                          model: Variation,
                          as: "variation",
                        },
                      ],
                    },
                  ],
                },
                {
                  model: Product,
                  as: "product",
                  include: [
                    {
                      model: ProductImage,
                      as: "images",
                      attributes: ["url", "blobName", "fileName"],
                    },
                    {
                      model: Store,
                      as: "store",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: ShippingInfo,
          as: "shippingInfo",
          attributes: ["id"],
          include: [
            {
              model: Address,
              as: "address",
            },
            {
              model: ShippingType,
              as: "shippingType",
              attributes: ["name", "description", "estimatedDays", "price"],
            },
          ],
        },
        {
          model: CheckOut,
          as: "checkout",
          where: {
            [Op.and]: {
              customerId: id,
              deletedAt: null,
              
            }
          },
          attributes: ["id", "orderCode"],
          include: [
            {
              model: Payment,
              as: "payment",
              attributes: [
                "payment_method",
                "status",
                "channel",
                "currency_code",
                "amount_authorized_minor",
                "amount_captured_minor",
                "amount_refunded_minor",
                "pgw_status",
                "updated_at",
                "providerRef"
              ],
            },
          ],
        },
        {
          model: RefundOrder,
          as: "refundOrders",
        },
      ],
    });
    return res
      .status(200)
      .json({ body: getUserOrders.rows, count: getUserOrders.count });
  } catch (error) {
    console.log("error", error);
  }
};

export const findUserCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  console.log(id);
  try {
    const cartId = await ShoppingCart.findOne({ where: { userId: id } });
    if (cartId) {
      const shoppingCartData = await ShoppingCartItem.findAndCountAll({
        where: { cartId: cartId.id },
        include: [
          {
            model: ProductItem,
            as: "productItem",
            include: [
              {
                model: ProductConfiguration,
                as: "configurations",
                include: [
                  {
                    model: VariationOption,
                    as: "variationOption",
                    include: [
                      {
                        model: Variation,
                        as: "variation",
                      },
                    ],
                  },
                ],
              },
              {
                model: Product,
                as: "product",
                include: [
                  {
                    model: Store,
                    as: "store",
                  },
                ],
              },
            ],
          },
        ],
      });
      res.json({ data: shoppingCartData.rows, count: shoppingCartData.count });
    }
  } catch (error) {
    res.json({ body: error });
  }
};

export const deleteChart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const item = req.body;
  try {
    for (let i = 0; i < item.length; i++) {
      await ShoppingCartItem.destroy({
        where: {
          id: item[i],
        },
      });
    }
    res.json({ message: `del ${item}` });
  } catch (error) {
    console.log();
    res.json({ error: error });
  }
};

export const createOrderId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { customerId, orderData } = req.body;
  console.log(req.body)
  const user = await User.findByPk(customerId);
  const groupStoreId = orderData.reduce((acc: any, item: any) => {
    const key = item.productItem.product.storeId;
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
  try {
    if (user) {
      const orderCod = "DGS" + Date.now() + customerId;
      const checkoutId = await CheckOut.create({
        customerId: customerId,
        orderCode: orderCod,
      });
      const sumprice = (data) => {
        if (!data) return 0;
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i].lineTotalMinor;
          console.log(sum);
        }
        return sum;
      };
      Object.entries(groupStoreId).map(async ([key, values]) => {
        let orderData = await Order.create({
          checkoutId: checkoutId.id,
          reference: orderCod + key,
          subtotalMinor: sumprice(values),
          shippingFeeMinor: 0,
          taxTotalMinor: 0,
          discountTotalMinor: 0,
          grandTotalMinor: 0,
          currencyCode: "",
          status: OrderStatus.PENDING,
          customerNameSnapshot: user.firstName,
          customerEmailSnapshot: user.email,
          storeNameSnapshot: "",
          storeId: Number(key),
        });
        await orderData.save();
        for (let i = 0; i < values.length; i++) {
          const orderItem = await OrderItem.create({
            orderId: orderData.id,
            productId: values[i].productItem.productId,
            productItemId: values[i].productItemId,
            quantity: values[i].quantity,
            unitPriceMinor: values[i].productItem.priceMinor, //error pull price
            discountMinor: 0,
            taxRate: "0.0000",
            productNameSnapshot: values[i].productItem.product.name,
            productSkuSnapshot: values[i].productItem.sku,
            productImageSnapshot: "",
          });
          orderItem.save();
        }
      });
      res.json({ data: orderCod });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ error: error });
  }
};

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    orderCode,
    customerId,
    paymentMethod,
    shippingTypeId,
    shippingAddress,
    productprice, //รวมเผื่อมีสองร้าน
    shippingfee,
    orderNote,
  } = req.body;
  let paymentResponse ;
  try {
    const user = await User.findByPk(customerId);
    const taxTotalMinor = 0;
    const discountTotalMinor = 0;
    const checkoutId = await CheckOut.findOne({
      where: { orderCode: orderCode },
      attributes: ["id","createdAt"],
    });
    if (!user || !checkoutId) return;
    const orderId = await Order.findAll({
      where: { checkoutId: checkoutId.id },
    });
    const grandTotalMinor =
      productprice +
      shippingfee * orderId.length +
      taxTotalMinor -
      discountTotalMinor; //รวมทั้งหมด ส่งให้จ่าย

    for (let i = 0; i < orderId.length; i++) {
      await Order.update(
        {
          shippingFeeMinor: shippingfee, //ราคาต่อร้าน
          taxTotalMinor,
          discountTotalMinor,
          currencyCode: "THB",
          orderNote,
          grandTotalMinor:
            shippingfee +
            orderId[i].subtotalMinor +
            taxTotalMinor -
            discountTotalMinor, // , ไปรวมใน database แทน
        },
        { where: { id: orderId[i].id } }
      );
      let orderData = await ShippingInfo.create({
        orderId: orderId[i].id,
        shippingTypeId,
        shippingAddress,
        shippingStatus: ShippingStatus.PENDING,
        //ไม่ได้ทำ snapshot
      });
      await OrderStatusHistory.create({
        orderId: orderId[i].id,
        toStatus: OrderStatus.PENDING,
        changedByType: ActorType.CUSTOMER,
        source: "API",
        metadata: {},
      });
      orderData.save();
    }
    const paymentData = await Payment.create({
      checkoutId: checkoutId.id, //ใช้ orderCode
      paymentMethod,
      status: PaymentStatus.PENDING,
      provider: "DGS_PGW", // Add a suitable provider value here
      channel: "CARD",
      currencyCode: "THB",
      amountAuthorizedMinor: grandTotalMinor,
      amountCapturedMinor: grandTotalMinor,
      pgwStatus: "PENDING",
      pgwPayload: { orderId: orderCode, status: "PENDING" },
    });
    paymentData.save();
    if (paymentMethod == PaymentMethod.CREDIT_CARD) {
      const contentSigCard = contentSignature({
        mid: midCard,
        order_id: orderCode,
        // description: productName,
        amount: grandTotalMinor / 100,
        expiry: 15,
        url_redirect: "http://localhost:4000/api/customer/payment/callback",
        url_notify: "http://localhost:4000/api/customer/payment/notify", //web เรา
      });
      paymentResponse = await axios.request({
        method: "post",
        url: "http://localhost:4002/payment",
        data: {
          mid: midCard,
          order_id: orderCode,
          // description: productName,
          amount: grandTotalMinor / 100,
          expiry: 15,
          url_redirect: "http://localhost:4000/api/customer/payment/callback",
          url_notify: "http://localhost:4000/api/customer/payment/notify", //web เรา
        },
        headers: {
          "X-API-ID": apiId,
          "X-API-Key": apiKey,
          "X-Partner-ID": partnerId,
          "X-Content-Signature": contentSigCard,
        },
      });
      await Order.update(
        {
          reference: paymentResponse.data.reference,
        },
        { where: { checkoutId: checkoutId.id } }
      );
      await Payment.update(
        {
          urlRedirect: paymentResponse.data.redirect_url,
          providerRef: paymentResponse.data.reference,
        },
        {
          where: { checkoutId: checkoutId.id },
        }
      );
      const paymentStatus = await PaymentGatewayEvent.create({
        checkoutId: checkoutId.id,
        paymentId: paymentData.id,
        type: "PAYMENT",
        amountMinor: grandTotalMinor,
        provider: "DGS_PGW",
        status: "PENDING",
        reqJson: {
          mid: midCard,
          order_id: orderCode,
          // description: productName,
          amount: grandTotalMinor / 100,
          expiry: 15,
          url_redirect: "http://localhost:4000/api/customer/payment/callback",
          url_notify: "http://localhost:4000/api/customer/payment/notify", //web เรา
        },
        resJson: paymentResponse.data,
      });
      paymentStatus.save();
    }
    if (paymentMethod == PaymentMethod.QR) {
      const contentSigQr = contentSignature({
        mid: midQR30,
        order_id: orderCode,
        // description: productName,
        amount: grandTotalMinor / 100,
        expiry: 15,
        url_redirect: "http://localhost:4000/api/customer/payment/callback",
        url_notify: "http://localhost:4000/api/customer/payment/notify", //web เรา
        qrcode: {
          biller_reference_1: `REF${orderId}`,
        },
      });
      paymentResponse = await axios.request({
        method: "post",
        url: "http://localhost:4002/payment",
        data: {
          mid: midQR30,
          order_id: orderCode,
          // description: productName,
          amount: grandTotalMinor / 100,
          expiry: 15,
          url_redirect: "http://localhost:4000/api/customer/payment/callback",
          url_notify: "http://localhost:4000/api/customer/payment/notify", //web เรา
          qrcode: {
            biller_reference_1: `REF${orderId}`,
          },
        },
        headers: {
          "X-API-ID": apiId,
          "X-API-Key": apiKey,
          "X-Partner-ID": partnerId,
          "X-Content-Signature": contentSigQr,
        },
      });
      await Order.update(
        {
          reference: paymentResponse.data.reference,
        },
        { where: { checkoutId: checkoutId.id } }
      );
      await Payment.update(
        {
          urlRedirect: paymentResponse.data.redirect_url,
          providerRef: paymentResponse.data.reference,
        },
        {
          where: { checkoutId: checkoutId.id },
        }
      );
      const paymentStatus = await PaymentGatewayEvent.create({
        checkoutId: checkoutId.id,
        paymentId: paymentData.id,
        type: "PAYMENT",
        amountMinor: grandTotalMinor,
        provider: "DGS_PGW",
        status: "PENDING",
        reqJson: {
          mid: midQR30,
          order_id: orderCode,
          // description: productName,
          amount: grandTotalMinor / 100,
          expiry: 15,
          url_redirect: "http://localhost:4005/api/customer/payment/callback",
          url_notify: "http://localhost:4005/api/customer/payment/notify", //web เรา
          qrcode: {
            biller_reference_1: `REF${orderCode}`,
          },
        },
        resJson: paymentResponse.data,
      });
      paymentStatus.save();
    }
    if(paymentResponse) {
      res.status(200).json({ data: paymentResponse.data , queue: true});
      await enqueueAutoCancel({
        orderId: orderId[0].id, //send checkout id not order id
        createdAt: orderId[0].createdAt.toString()
      },{
        delayMs: 15 * 1000
      })
    }
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ error: error });
  }
};

export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const delOrder = await CheckOut.destroy({
      where: { orderCode: id },
    });
    return res.status(200).json({ data: "connect del order" });
  } catch (error) {
    console.log("error", error);
  }
};

export const findShipping = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await ShippingType.findAll();
    res.json({ data: response });
  } catch (error) {
    res.json({ error: error });
  }
};

export const createCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { customerId, productItemId, quantity } = req.body;
  try {
    for(let i = 0 ; i < productItemId.length ; i++ ){
      let product = await ProductItem.findByPk(productItemId[i]);
      let cardId;
      const haveshoppingCart = await ShoppingCart.findOne({
        where: { userId: customerId },
      });
  
      if (!haveshoppingCart) {
        const createCart = await ShoppingCart.create({
          userId: customerId,
        });
        createCart.save();
        cardId = createCart.id;
      } else {
        cardId = haveshoppingCart.id;
      }
      if (product) {
        const findProduct = await ShoppingCartItem.findOne({
          where: { productItemId: productItemId[i] },
        });
        if (findProduct?.productItemId) {
          const cardData = await ShoppingCartItem.update(
            {
              quantity: quantity[i] + findProduct.quantity,
            },
            { where: { productItemId: productItemId[i] } }
          );
          res.json({ data: cardData });
        } else {
          const cardData = await ShoppingCartItem.create({
            cartId: cardId,
            productItemId: productItemId[i],
            quantity: quantity[i],
            unitPriceMinor: product.priceMinor,
          });
          res.json({ data: cardData });
        }
      }
    }
  } catch (error) {
    console.log();
    res.json({ error: error });
  }
};


export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  const order = await Order.findByPk(id);
  try {
    console.log(order?.status,order?.status == OrderStatus.DELIVERED )
    if (order && (order.status == OrderStatus.DELIVERED || order.status === OrderStatus.CANCELED_REFUND)) {
      const createStatus = await OrderStatusHistory.create({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: OrderStatus.COMPLETE,
        changedByType: ActorType.CUSTOMER,
      });
      const updateOrder = await Order.update(
        {
          status: OrderStatus.COMPLETE,
        },
        { where: { id: order.id } }
      );
      res.json({ data: createStatus });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ error: error });
  }
};

// export const cancelOrder = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const id = req.params.id;
//   const { reason, description, contactEmail, url } = req.body;
//   const findOrder = await Order.findByPk(id);
//   const findPayment = await Payment.findOne({
//     where: { checkoutId: findOrder?.checkoutId },
//   });
//   console.log( findOrder?.status === OrderStatus.CANCELED_REFUND, findOrder?.status)
//   if (
//     findOrder && (findOrder.status === OrderStatus.PAID ||findOrder.status === OrderStatus.DELIVERED || findOrder.status === OrderStatus.CANCELED_REFUND) &&
//     findPayment
//   ) {
//     try {
//       const cancelRequest = await RefundOrder.create({
//         orderId: Number(id),
//         paymentId: findPayment.id,
//         reason,
//         status: RefundStatus.REQUESTED,
//         amountMinor: findOrder.grandTotalMinor,
//         currencyCode: findOrder.currencyCode,
//         description,
//         contactEmail,
//         requestedBy: "CUSTOMER",
//       });
//       await RefundStatusHistory.create({
//         refundOrderId: cancelRequest.id,
//         toStatus: RefundStatus.REQUESTED,
//         reason,
//         changedByType: ActorType.CUSTOMER,
//         source: "WEBSITE",
//       });
//       await OrderStatusHistory.create({
//         orderId: findOrder.id,
//         fromStatus: findOrder.status,
//         toStatus: OrderStatus.REFUND_REQUEST,
//         changedByType: ActorType.CUSTOMER,
//         source: "WEB",
//       });
//       await PaymentGatewayEvent.update(
//         {
//           refundOrderId: cancelRequest.id,
//         },
//         {
//           where: {
//             [Op.and]: {
//               checkoutId: findOrder.checkoutId,
//               paymentId: findPayment.id,
//             },
//           },
//         }
//       );
//       await Order.update(
//         {
//           status: OrderStatus.REFUND_REQUEST,
//         },
//         { where: { id: id } }
//       );
//       res.json({ data: "success" });
//     } catch (error) {
//       console.log(error.message)
//       res.json({ error: error });
//     }
//   }
// };

export const customerCancel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  console.log('in customer cancel', id)
  const findOrder = await Order.findAll({
    where: { checkoutId: id },
    attributes: ["id"],
  });
  try {
    await Order.update(
      {
        status: OrderStatus.CUSTOMER_CANCELED,
      },
      {
        where: { checkoutId: id },
      }
    );
    await Payment.update(
      {
        status: PaymentStatus.FAILED,
        pgwStatus: 'CANCELED'
      },
      {
        where: { checkoutId: id },
      }
    );
    for (let i = 0; i < findOrder.length; i++) {
      let createLog = await OrderStatusHistory.create({
        orderId: findOrder[i].id,
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.CUSTOMER_CANCELED,
        changedByType: ActorType.CUSTOMER,
        source: "APP",
        metadata: {},
      });
      createLog.save();
    }
    res.json({data: 'success'})
  } catch (error) {
    console.log(error)
    res.json({error: error})
  }
};
export const customerCancelV2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  console.log('in customer cancel', id)
  const findOrder = await Order.findByPk(id);
  try {
    await Order.update(
      {
        status: OrderStatus.CUSTOMER_CANCELED,
      },
      {
        where: { id: id },
      }
    );

    await Payment.update(
      {
        status: PaymentStatus.FAILED,
        pgwStatus: 'CANCELED'
      },
      {
        where: { checkoutId: findOrder?.checkoutId },
      }
    );
    res.json({data: 'success'})
  } catch (error) {
    console.log(error)
    res.json({error: error})
  }
};
export const revokeCancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // check 7 day ยังไม่ทำ
  // check ด้วยว่ามาจาก DELIVERED ไหม กันคิว fail แล้วยิง api revoke cancel เพราะเราไม่ให้ยกเลิกตอนขอคืนเงินหลังจากพึ่งจ่ายเงิน
  const id = req.params.id;
  const refund = await RefundOrder.findByPk(id);
  if (refund) {
    const order = await Order.findByPk(refund.orderId);
    try {
      await RefundOrder.update(
        {
          status: RefundStatus.CANCELED,
        },
        { where: { id: id } }
      );
      if (order) {
        await OrderStatusHistory.create({
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELED_REFUND,
          changedByType: ActorType.CUSTOMER,
          source: "WEB",
        });
      }
      await Order.update(
        {
          status: OrderStatus.CANCELED_REFUND,
        },
        { where: { id: refund.orderId } }
      );
      await RefundStatusHistory.create({
        refundOrderId: Number(id),
        fromStatus: RefundStatus.REQUESTED,
        toStatus: RefundStatus.CANCELED,
        reason: "customer cancel",
        changedByType: ActorType.CUSTOMER,
        source: "WEBSITE",
      });
      res.json({ data: "success" });
    } catch (error) {
      res.json({ error: error });
    }
  }
};
// helper
async function getOrderTimes(orderId: number) {
  const ord = await Order.findByPk(orderId, {
    include: [
      {
        model: CheckOut,
        as: "checkout",
        include: [{ model: Payment, as: "payment", attributes: ["paidAt"] }],
      },
      { model: ShippingInfo, as: "shippingInfo", attributes: ["deliveredAt"] },
    ],
  });
  if (!ord) return { order: null, paidAt: null as Date | null, deliveredAt: null as Date | null };
  const paidAt = (ord as any).checkout?.payment?.paidAt ?? null;
  const deliveredAt = (ord as any).shippingInfo?.deliveredAt ?? null;
  return { order: ord, paidAt, deliveredAt };
}

/**
 * POST /orders/cancel/:id
 * use-case:
 *  - PENDING        -> CUSTOMER_CANCELED (ยกเลิกก่อนจ่าย)
 *  - PAID           -> เปิดคำขอคืนเงิน + เข้าคิวให้ worker auto-approve (ถ้ายังไม่ DELIVERED)
 *  - DELIVERED, CANCELED_REFUND -> เปิดคำขอคืนเงิน (รอร้านอนุมัติ, request + retry 3 ครั้ง ภายใน 7 วันหลังจาก delivered)
 */
export const cancelOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { reason, description, contactEmail } = (req.body ?? {}) as {
    reason?: string;
    description?: string;
    contactEmail?: string;
  };

  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid orderId" });

  const { order, deliveredAt } = await getOrderTimes(id);
  console.log("order: ", order?.status)
  if (!order) return res.status(404).json({ error: "Order not found" });

  // status ที่ไม่อนุญาตให้ customer-service ทำ cancel/refund
  const transitStatuses: OrderStatus[] = [
    OrderStatus.PROCESSING,
    OrderStatus.READY_TO_SHIP,
    OrderStatus.HANDED_OVER,
    OrderStatus.SHIPPED,
    OrderStatus.TRANSIT_LACK,
    OrderStatus.RE_TRANSIT,
    OrderStatus.PENDING,
    OrderStatus.AWAITING_RETURN,
    OrderStatus.COMPLETE,
    OrderStatus.CUSTOMER_CANCELED,
    OrderStatus.MERCHANT_CANCELED,
    OrderStatus.RECEIVE_RETURN,
    OrderStatus.REFUND_APPROVED,
    OrderStatus.REFUND_FAIL,  
    OrderStatus.REFUND_PROCESSING,
    OrderStatus.REFUND_REJECTED,
    OrderStatus.REFUND_REQUEST,
    OrderStatus.REFUND_RETRY,
    OrderStatus.REFUND_SUCCESS,
    OrderStatus.RETURN_FAIL,
    OrderStatus.RETURN_VERIFIED
    // อาจเพิ่มอีก
  ];
  if (transitStatuses.includes(order.status as OrderStatus)) {
    console.log("not allow")
    return res.status(422).json({
      error:
        "Cancellation/refund not allowed in this status.",
    });
  }

  // 1) ยกเลิกก่อนจ่าย สถานะยัง PENDING แบบแมนนวล ระบบยกเลิกอัติโนมัติยังไม่มี
  if (order.status === OrderStatus.PENDING) {
    await sequelize.transaction(async (t) => {
      await OrderStatusHistory.create(
        {
          orderId: order.id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.CUSTOMER_CANCELED,
          changedByType: ActorType.CUSTOMER,
          source: "WEB",
          reason: reason ?? "Customer canceled before payment",
        } as any,
        { transaction: t }
      );
      await order.update({ status: OrderStatus.CUSTOMER_CANCELED } as any, { transaction: t });
    });
    return res.json({ data: { id: order.id, status: OrderStatus.CUSTOMER_CANCELED } });
  }

  // ถ้าไม่ใช่ PENDING แปลว่าจ่ายเงินแล้ว (PAID, DELIVERED, CANCELED_REFUND)
  const payment = await Payment.findOne({ where: { checkoutId: order.checkoutId } });
  if (!payment) return res.status(400).json({ error: "Payment record not found" });

  // 2) DELIVERED / CANCELED_REFUND -> สร้าง refund order, ไม่เข้าคิว
  const isDelivered =
  order.status === OrderStatus.DELIVERED ||
  order.status === OrderStatus.CANCELED_REFUND;

  console.log("Is delivered status: ", isDelivered)
  if (isDelivered) {
    // no time stamp
    if (!deliveredAt) {
      return res.status(422).json({ error: "Missing deliveredAt timestamp" });
    }
    // 7 วันจาก deliveredAt ยกเลิกไม่ได้ orderStatus.COMPLETE แล้ว
    if (differenceInDays(new Date(), new Date(deliveredAt)) > OrderPolicy.refundFromDeliveredDays) {
      return res.status(422).json({ error: "Refund request window after delivery has passed" });
    }
    // limit 3 requests ภายใน 7 วัน (นับจาก deliveredAt)
    const since = addDays(new Date(deliveredAt), -OrderPolicy.refundRetryWindowDays);
    const retryCount = await RefundOrder.count({
      where: { orderId: order.id, requestedAt: { [Op.gte]: since } },
    });
    if (retryCount >= OrderPolicy.refundMaxRetries) {
      return res.status(429).json({ error: "Refund request retries exceeded" });
    }

    await sequelize.transaction(async (t) => {
      // สร้าง RefundOrder ใหม่ เพราะเช็ค จำนวนและเวลาในการขอ refund แล้ว
      const refund = await RefundOrder.create(
        {
          orderId: order.id,
          paymentId: payment.id,
          reason: reason ?? null,
          status: RefundStatus.REQUESTED,
          amountMinor: order.grandTotalMinor,
          currencyCode: order.currencyCode,
          description: description ?? null,
          contactEmail: contactEmail ?? null,
          requestedBy: "CUSTOMER",
          requestedAt: new Date(),
        } as any,
        { transaction: t }
      );

      await RefundStatusHistory.create(
        {
          refundOrderId: refund.id,
          toStatus: RefundStatus.REQUESTED,
          reason: reason ?? "Customer requested refund",
          changedByType: ActorType.CUSTOMER,
          source: "WEB",
        } as any,
        { transaction: t }
      );
      // ไม่ต้องแก้ PaymentGatewayEvent มีหน้าที่สร้างใหม่เรื่อยๆ ตอนที่ action กับ payment gateway
      // await PaymentGatewayEvent.update(
      //   {
      //     refundOrderId: refund.id
      //   } as any,
      //   { where: {checkoutId: order.checkoutId, paymentId: payment.id }, transaction: t }
      // );

      await OrderStatusHistory.create(
        {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.REFUND_REQUEST,
          changedByType: ActorType.CUSTOMER,
          source: "WEB",
          reason: reason ?? null,
        } as any,
        { transaction: t }
      );

      await order.update({ status: OrderStatus.REFUND_REQUEST } as any, { transaction: t });
    });

    return res.json({ data: { id: order.id, status: OrderStatus.REFUND_REQUEST, queued: false } });
  }

  // 3) PAID -> เปิดคำขอคืนเงิน + ใส่คิวให้ worker auto-approve (ถ้ายังไม่เคย DELIVERED)
  if (order.status === OrderStatus.PAID) {
    await sequelize.transaction(async (t) => {
      const refund = await RefundOrder.create(
        {
          orderId: order.id,
          paymentId: payment.id,
          reason: reason ?? null,
          status: RefundStatus.REQUESTED,
          amountMinor: order.grandTotalMinor,
          currencyCode: order.currencyCode,
          description: description ?? null,
          contactEmail: contactEmail ?? null,
          requestedBy: "CUSTOMER",
          requestedAt: new Date(),
        } as any,
        { transaction: t }
      );

      await RefundStatusHistory.create(
        {
          refundOrderId: refund.id,
          toStatus: RefundStatus.REQUESTED,
          reason: reason ?? "Customer requested refund (PAID)",
          changedByType: ActorType.CUSTOMER,
          source: "WEB",
        } as any,
        { transaction: t }
      );

      // await PaymentGatewayEvent.update(
      //   { refundOrderId: refund.id } as any,
      //   { where: { checkoutId: order.checkoutId, paymentId: payment.id }, transaction: t }
      // );

      await OrderStatusHistory.create(
        {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.REFUND_REQUEST,
          changedByType: ActorType.CUSTOMER,
          source: "WEB",
          reason: reason ?? null,
        } as any,
        { transaction: t }
      );

      await order.update({ status: OrderStatus.REFUND_REQUEST } as any, { transaction: t });
    });

    // ถ้ายังไม่เคย DELIVERED -> enqueue ให้ worker auto-approve
    const hasDelivered = await OrderStatusHistory.findOne({
      where: { orderId: order.id, toStatus: OrderStatus.DELIVERED },
      order: [["created_at", "DESC"]],
    });

    if (!hasDelivered) {
      // correlation id format : cust-${order.id}-${Date.now()}
      const corr = (req.headers["x-request-id"] as string) || `cust-${order.id}-${Date.now()}`;
      console.log("correlation id: ", corr)
      await enqueueRefundAutoApprove({
        orderId: order.id,
        requestedAt: new Date().toISOString(),
        correlationId: corr,
        reason: reason ?? "Customer requested refund (pre-delivery)",
      });
      return res.json({ data: { id: order.id, status: OrderStatus.REFUND_REQUEST, queued: true } });
    }
    return res.json({ data: { id: order.id, status: OrderStatus.REFUND_REQUEST, queued: false } });
  }

  // สถานะอื่นๆไม่รองรับ
  return res.status(422).json({ error: `Cancel/Refund not allowed in status ${order.status}` });
};

