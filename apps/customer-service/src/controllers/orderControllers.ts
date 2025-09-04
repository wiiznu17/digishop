import { Address } from "@digishop/db/src/models/Address";
import { Order } from "@digishop/db/src/models/Order";
import { OrderItem } from "@digishop/db/src/models/OrderItem";
import { Payment } from "@digishop/db/src/models/Payment";
import { Product } from "@digishop/db/src/models/Product";
import { ProductImage } from "@digishop/db/src/models/ProductImage";
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo";
import { ShippingType } from "@digishop/db/src/models/ShippingType";
import { Store } from "@digishop/db/src/models/Store";
import { User } from "@digishop/db/src/models/User";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingStatus,
} from "@digishop/db/src/types/enum";
import axios from "axios";
import { count } from "console";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
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

const contentSignature = (
  body: Object
) => {
  console.log("sign key", String(signKey));
  const hmac = crypto.createHmac(
    "sha256",
    Buffer.from(String(signKey), "base64")
  );
  return hmac
    .update(
      JSON.stringify(body)
    )
    .digest("base64");
};

export const findOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  try {
    const getOrders = await Order.findByPk(id, {
      attributes: ["id","order_code","reference", "status","created_at","grand_total_minor","currency_code","order_note"],
      include: [
        {
          model: ShippingInfo,
          as: "shippingInfo",
          attributes: ["id"],
          include: [
            {
              model: Address,
              as: "address"
            },
            {
              model: ShippingType,
              as: "shippingType",
              attributes: ["name","description","estimatedDays","price"]
            }
          ]
        },
        {
          model: OrderItem,
          as: "items",
          attributes: ["quantity","unit_price_minor"],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name"],
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  attributes: ['url','blobName','fileName']
                }
              ]
            },
          ],
        },
        {
          model: Store,
          as: "store",
          attributes: ["storeName"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["payment_method","updated_at"],
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
      where: { customerId: id },
      attributes: ["id", "reference", "status","currency_code","order_note","grand_total_minor"],
      include: [
        {
          model: OrderItem,
          as: "items",
          attributes: ["quantity","unit_price_minor","discount_minor","product_name_snapshot"],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name"],
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  attributes: ['url','blobName','fileName']
                }
              ]
            },
          ],
        },
        {
          model: Store,
          as: "store",
          attributes: ["storeName"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["payment_method","status","channel","currency_code","amount_authorized_minor","amount_captured_minor","amount_refunded_minor","pgw_status"],
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

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    customerId,
    productName,
    storeId,
    grandTotalMinor,
    productId,
    quantity,
    unitPrice,
    shippingTypeId,
    shippingAddress,
    orderNote,
    paymentMethod
  } = req.body;
  const orderCod = "DGS" + Date.now() + productId + customerId;

  try {
    const user = await User.findByPk(customerId)
    const store = await Store.findByPk(storeId)
    const product = await Product.findByPk(productId)
    if(!user || !store || !product) return
    const orderData = await Order.create({
      orderCode: orderCod,
      customerId,
      storeId,
      reference: orderCod,
      subtotalMinor: grandTotalMinor,
      shippingFeeMinor: 0,
      taxTotalMinor: 0,
      discountTotalMinor: 0,
      grandTotalMinor,
      currencyCode: 'THB',
      status: OrderStatus.PENDING,
      orderNote,
      customerNameSnapshot: user.firstName,
      customerEmailSnapshot: user.email,
      storeNameSnapshot: store.storeName,
    });
    await OrderItem.create({
      orderId: orderData.id,
      productId,
      quantity,
      unitPriceMinor: unitPrice,
      discountMinor: 0,
      taxRate: '0.0000',
      lineTotalMinor: 0,
      productNameSnapshot: product.name,
      productImageSnapshot: `{"id": ${product.id}, "sku": "", "name": "${product.name}", "priceMinor": ${unitPrice}}`
    });
    await ShippingInfo.create({
      orderId: orderData.id,
      shippingTypeId,
      shippingAddress,
      shippingStatus: ShippingStatus.PENDING,
    });
    await Payment.create({
      orderId: orderData.id,
      paymentMethod,
      status: PaymentStatus.PENDING,
      channel: "CARD",
      currencyCode: "THB",
      amountAuthorizedMinor: grandTotalMinor,
      amountCapturedMinor: grandTotalMinor,
      pgwStatus: 'PENDING',
      pgwPayload: { orderId:  orderData.id, status: 'PENDING'},
      provider: "DGS_PGW", // Add a suitable provider value here
    });
    orderData.save();
    if(paymentMethod == PaymentMethod.CREDIT_CARD){
      const contentSigCard = contentSignature(
        {
          mid: midCard,
          order_id: orderCod,
          description: productName,
          amount: grandTotalMinor/100,
          expiry: 15,
          url_redirect: "http://localhost:4003/api/payment/callback",
          url_notify: "http://localhost:4003/api/payment/notify", //web เรา
        }
      );
      const responseCardPayment = await axios.request({
        method: "post",
        url: "http://localhost:4002/payment",
        data: {
          mid: midCard,
          order_id: orderCod,
          description: productName,
          amount: grandTotalMinor/100,
          expiry: 15,
          url_redirect: "http://localhost:4003/api/payment/callback",
          url_notify: "http://localhost:4003/api/payment/notify", //web เรา
        },
        headers: {
          "X-API-ID": apiId,
          "X-API-Key": apiKey,
          "X-Partner-ID": partnerId,
          "X-Content-Signature": contentSigCard,
        },
      });
      orderData.reference = responseCardPayment.data.reference;
      orderData.save();
      res.status(200).json({ data: responseCardPayment.data });
    }
    if(paymentMethod == PaymentMethod.QR){
      const randomNum = Math.random() * (1000 - 1) + 1
      const contentSigQr = contentSignature(
        {
          mid: midQR30,
          order_id: orderCod,
          description: productName,
          amount: grandTotalMinor/100,
          expiry: 15,
          url_redirect: "http://localhost:4003/api/payment/callback",
          url_notify: "http://localhost:4003/api/payment/notify", //web เรา
          qrcode : {
            biller_reference_1: `REF${orderData.id}`
          }
        }
      );
      const responseQrPayment = await axios.request({
        method: "post",
        url: "http://localhost:4002/payment",
        data: {
          mid: midQR30,
          order_id: orderCod,
          description: productName,
          amount: grandTotalMinor/100,
          expiry: 15,
          url_redirect: "http://localhost:4003/api/payment/callback",
          url_notify: "http://localhost:4003/api/payment/notify", //web เรา
          qrcode : {
            biller_reference_1: `REF${orderData.id}`
          }
        },
        headers: {
          "X-API-ID": apiId,
          "X-API-Key": apiKey,
          "X-Partner-ID": partnerId,
          "X-Content-Signature": contentSigQr,
        },
      });
      orderData.reference = responseQrPayment.data.reference;
      orderData.save();
      res.status(200).json({ data: responseQrPayment.data });
    }

  } catch (error) {
    res.status(404).json({ error: error });
  }
};

export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return res.status(200).json({ message: "connect del order" });
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
