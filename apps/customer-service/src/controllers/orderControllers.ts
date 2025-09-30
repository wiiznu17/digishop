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
              orderCode: id,
            },
          },
          include: [
            {
              model: Payment,
              as: "payment",
              attributes: ["id","pgw_status", "payment_method", "updated_at"],
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
                  as:'configurations',
                  include: [
                    {
                      model: VariationOption,
                      as: 'variationOption',
                      include: [
                        {
                          model: Variation,
                          as: 'variation'
                        }
                      ]
                    }
                  ]
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
                as:'configurations',
                include: [
                  {
                    model: VariationOption,
                    as: 'variationOption',
                    include: [
                      {
                        model: Variation,
                        as: 'variation'
                      }
                    ]
                  }
                ]
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
          }],
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
          where: { customerId: id },
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
                "updated_at"
              ],
            },
          ],
        },
      ],
    });
    // const getUserOrders = await CheckOut.findAndCountAll({
    //   where: {customerId : id },
    //
    //   include: [
    //     {
    //       model: Order,
    //       as: 'orders',
    //       attributes: [
    //       "id",
    //       "reference",
    //       "status",
    //       "currency_code",
    //       "order_note",
    //       "grand_total_minor",
    //       ],
    //       include: [
    //         {
    //           model: OrderItem,
    //           as: "items",
    //           attributes: [
    //             "quantity",
    //             "unit_price_minor",
    //             "discount_minor",
    //             "product_name_snapshot",
    //           ],
    //           include: [
    //             {
    //               model: Product,
    //               as: "product",
    //               attributes: ["name"],
    //               include: [
    //                 {
    //                   model: ProductImage,
    //                   as: "images",
    //                   attributes: ["url", "blobName", "fileName"],
    //                 },
    //               ],
    //             },
    //           ],
    //         },
    //         {
    //           model: Store,
    //           as: "store",
    //           attributes: ["storeName"],
    //         },
    //       ],
    //     },
    //     {
    //       model: Payment,
    //       as: "payment",
    //       attributes: [
    //         "payment_method",
    //         "status",
    //         "channel",
    //         "currency_code",
    //         "amount_authorized_minor",
    //         "amount_captured_minor",
    //         "amount_refunded_minor",
    //         "pgw_status",
    //       ],
    //     },
    //   ]
    // });
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
              as:'configurations',
              include: [
                {
                  model: VariationOption,
                  as: 'variationOption',
                  include: [
                    {
                      model: Variation,
                      as: 'variation'
                    }
                  ]
                }
              ]
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
  const item =  req.body
  try {
    for(let i = 0; i < item.length ; i++){
      await ShoppingCartItem.destroy({
        where: {
          id: item[i]
        }
      })
    }
    res.json({ message: `del ${item}`})
  } catch (error) {
    console.log()
    res.json({error: error})
  }
}

export const createOrderId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { customerId, orderData } = req.body;
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
      if(!data)return 0
      let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += (data[i].lineTotalMinor)
          console.log(sum)
        }
        return sum
    }
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

  try {
    const user = await User.findByPk(customerId);
    const taxTotalMinor = 0
    const discountTotalMinor = 0
    const checkoutId = await CheckOut.findOne({
      where: { orderCode: orderCode },
      attributes: ["id"],
    });
    if (!user || !checkoutId) return;
    const orderId = await Order.findAll({
      where: {checkoutId: checkoutId.id}
    })
    const grandTotalMinor = productprice + (shippingfee * orderId.length) + taxTotalMinor - discountTotalMinor; //รวมทั้งหมด ส่งให้จ่าย
    
    for (let i = 0; i < orderId.length; i++) {
      await Order.update(
        {
          shippingFeeMinor: shippingfee , //ราคาต่อร้าน
          taxTotalMinor,
          discountTotalMinor,
          currencyCode: "THB",
          orderNote,
          grandTotalMinor: shippingfee + orderId[i].subtotalMinor + taxTotalMinor - discountTotalMinor, // , ไปรวมใน database แทน
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
      const responseCardPayment = await axios.request({
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
          reference: responseCardPayment.data.reference,
        },
        { where: { checkoutId: checkoutId.id  } }
      );
      await Payment.update(
        {
          providerRef: responseCardPayment.data.reference,
        },{
           where: { checkoutId: checkoutId.id  } 
        }
      )
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
        resJson: responseCardPayment.data,
      });
      paymentStatus.save();
      res.status(200).json({ data: responseCardPayment.data });
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
      const responseQrPayment = await axios.request({
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
          reference: responseQrPayment.data.reference,
        },
        { where: { checkoutId: checkoutId.id } }
      );
      await Payment.update(
        {
          providerRef: responseQrPayment.data.reference,
        },{
           where: { checkoutId: checkoutId.id  } 
        }
      )
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
        resJson: responseQrPayment.data,
      });
      paymentStatus.save();
      res.status(200).json({ data: responseQrPayment.data });
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
    const id = req.params.id
    const delOrder = await CheckOut.destroy({
      where: {orderCode: id}
    })
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
  const { customerId, productItemId, quantity, unitPriceMinor } = req.body;
  try {
    const product = await ProductItem.findByPk(productItemId);
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
        where: {productItemId: productItemId}
      })
      if(findProduct?.productItemId){
        const cardData = await ShoppingCartItem.update({
          quantity: quantity + findProduct.quantity,
        },{where : { productItemId: productItemId }});
        res.json({ data: cardData });
      }else{
        const cardData = await ShoppingCartItem.create({
          cartId: cardId,
          productItemId,
          quantity,
          unitPriceMinor: product.priceMinor,
        });
        res.json({ data: cardData });
      }
    }
  } catch (error) {
    console.log()
    res.json({ error: error });
  }
};

export const updateOrderStatus = async( 
  req: Request,
  res: Response,
  next: NextFunction) => {
    const id = req.params.id
    const order = await Order.findByPk(id)
    try {
      if(order && order.status == OrderStatus.DELIVERED){
        const createStatus = await OrderStatusHistory.create({
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.COMPLETE,
          changedByType: ActorType.CUSTOMER,
        })
        const updateOrder = await Order.update({
          status: OrderStatus.COMPLETE
        }, { where: {id: order.id}})
        res.json({data: createStatus})
      }
    } catch (error) {
      console.log(error.message)
      res.json({error: error})
    }
  }

export const cancelOrder = async(
  req: Request,
  res: Response,
  next: NextFunction) => {
  const id = req.params.id
  const { reason , description, contactEmail , url} = req.body
  const findOrder = await Order.findByPk(id)
  const findPayment = await Payment.findOne({
    where: { checkoutId: findOrder?.checkoutId }
  })
  console.log(req.body ,req.params.id)
  if(findOrder && ( findOrder.status === OrderStatus.PAID || findOrder.status === OrderStatus.DELIVERED) && findPayment ){
    try {
      const cancelRequest = await RefundOrder.create({
        orderId: Number(id),
        paymentId: findPayment.id,
        reason,
        status: RefundStatus.REQUESTED,
        amountMinor: findOrder.grandTotalMinor,
        currencyCode: findOrder.currencyCode,
        description,
        contactEmail,
        requestedBy: "CUSTOMER" 
      })
      await RefundStatusHistory.create({
        refundOrderId: cancelRequest.id,
        toStatus: RefundStatus.REQUESTED,
        reason,
        changedByType: ActorType.CUSTOMER ,
        source: "WEBSITE"
      })
      // if(url){
        // await RefundImage.create({
          //   refundOrderId: cancelRequest.id,
          //   url,
          //   blobName,
          //   filename,
          //   isMain,
          //   sortOrder
          // })
      // }
        await OrderStatusHistory.create({
          orderId: findOrder.id,
          fromStatus: findOrder.status,
          toStatus: OrderStatus.REFUND_REQUEST,
          changedByType: ActorType.CUSTOMER,
          source: "WEB",
        })
        await PaymentGatewayEvent.update({
          refundOrderId: cancelRequest.id,
        }, { where: {
          [Op.and] : {
            checkoutId: findOrder.checkoutId,
            paymentId: findPayment.id
          }
        }
      })
      await Order.update({
        status: OrderStatus.REFUND_PROCESSING
      },{ where: {id: id}})
      res.json({ data: 'success'})
    } catch (error) {
      res.json({ error: error})
    }
    }
}
