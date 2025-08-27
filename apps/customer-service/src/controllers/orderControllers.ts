import { Order } from "@digishop/db/src/models/Order";
import { OrderItem } from "@digishop/db/src/models/OrderItem";
import { Product } from "@digishop/db/src/models/Product";
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo";
import { ShippingType } from "@digishop/db/src/models/ShippingType";
import { OrderStatus, ShippingStatus } from "@digishop/db/src/types/enum";
import axios from "axios";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
const signKey =
  process.env.MERCHANRT_SIGN_KEY ??
  "5LxvCzMEgCYb6kv+v23M3D1d4lnOHE1CiuA+uO8QTpM=";
const mid = process.env.MERCHANRT_MID ?? "0691001119";
const apiId =
  process.env.MERCHANRT_API_ID ?? "Etx4MmvXsHf9JeJ3ScaLqWrgWgnwUIGSwz_n_mF9q2w";
const apiKey =
  process.env.MERCHANRT_API_KEY ??
  "ApFbpLSXApOHFB2fTlqn0zWg3HjqucQVChYmxtpOarw";
const partnerId = process.env.MERCHANRT_PARTNER_ID ?? "1754627921";

const contentSignature = (
  orderId: string,
  description: string,
  amount: number,
  expiry: number,
  url_redirect: string,
  url_notify: string
) => {
  console.log('sign key',String(signKey))
  const hmac = crypto.createHmac('sha256', Buffer.from(String(signKey), 'base64'));
  return hmac.update(JSON.stringify(
    {
  mid,
  order_id: orderId,
  description,
  amount,
  expiry,
  url_redirect,
  url_notify
}
  )).digest("base64");
};
// const hmac = crypto.createHmac('sha256', Buffer.from(merchantCredential.signKey, 'base64'))
// const contentSignature = hmac.update(JSON.stringify(data)).digest('base64')

export const findOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  try {
    const getOrders = await Order.findByPk(id);
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
    });
    return res.status(200).json({ body: getUserOrders });
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
    totalPrice,
    productId,
    quantity,
    unitPrice,
    shippingTypeId,
    shippingAddress,
  } = req.body;
    console.log('signKey',signKey)

  try {
    const orderData = await Order.create({
      customerId,
      storeId,
      totalPrice,
      status: OrderStatus.PENDING,
    });
    await OrderItem.create({
      orderId: orderData.id,
      productId,
      quantity,
      unitPrice,
    });
    await ShippingInfo.create({
      orderId: orderData.id,
      shippingTypeId,
      shippingAddress,
      shippingStatus: ShippingStatus.PENDING,
    });
    orderData.save();
    const responsePayment = await axios.request({
      method: "post",
      url: "http://localhost:4002/payment",
      data: {
        mid: mid,
        order_id: String(orderData.id),
        description: productName,
        amount: totalPrice,
        expiry: 15,
        url_redirect: "http://localhost:3000/digishop/payment/callback",
        url_notify: "http://localhost:3000/digishop/setting", //web เรา
      },
      headers: {
        "X-API-ID": apiId,
        "X-API-Key": apiKey,
        "X-Partner-ID": partnerId,
        "X-Content-Signature": contentSignature(String(orderData.id),productName,totalPrice,15,'http://localhost:3000/digishop/payment/callback','http://localhost:3000/digishop/setting'),
      },
    });
    res.status(200).json({ data: responsePayment.data });
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
