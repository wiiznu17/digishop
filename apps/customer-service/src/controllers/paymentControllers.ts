import { Order } from "@digishop/db/src/models/Order";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { Payment } from "@digishop/db/src/models/Payment";
import { PaymentGatewayEvent } from "@digishop/db/src/models/PaymentGatewayEvent";
import {
  ActorType,
  OrderStatus,
  PaymentStatus,
} from "@digishop/db/src/types/enum";
import axios from "axios";
import { Request, Response } from "express";
export const getNotify = async (req: Request, res: Response) => {
  const {
    timestamp,
    reference,
    mid,
    payment_type,
    order_id,
    amount,
    currency,
    approval_code,
    status,
    bank_reference,
    authorize_token,
  } = req.body;
  console.log(req.body.status);
  try {
    console.log("order status", req.body);
  } catch (error) {
    console.log("error", error);
  }
  try {
    console.log(status);
    const findOrderId = await Order.findOne({
      where: { reference: String(reference) },
      attributes: ["id", "grandTotalMinor"],
    });
    const findPaymentId = await Payment.findOne({
      where: { orderId: findOrderId?.id },
      attributes: ["id"],
    });
    if (findOrderId) {
      const data = await Payment.update(
        {
          pgwStatus: status,
          pgwPayload: {
            "status": status,
            "orderId": findOrderId.id
          }
        },
        {
          where: {
            orderId: Number(findOrderId.id),
          },
        }
      );
    }
    if (status == "APPROVED" && findOrderId && findPaymentId) {
      await Order.update(
        {
          status: OrderStatus.PAID,
        },
        {
          where: { id: Number(findOrderId.id) },
        }
      );
      await Payment.update(
        {
          status: PaymentStatus.SUCCESS,
        },
        {
          where: { orderId: Number(findOrderId.id) },
        }
      );
      const createLog = await OrderStatusHistory.create({
        orderId: findOrderId.id,
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.PAID,
        changedByType: ActorType.SYSTEM,
        source: "API",
        metadata: {},
      });
      await PaymentGatewayEvent.create({
        orderId: findOrderId.id,
        paymentId: findPaymentId.id,
        type: "NOTIFY",
        amountMinor: findOrderId.grandTotalMinor,
        provider: "DIGIPAY",
        status: "SUCCESS",
        reqJson: req.body,
        resJson: {},
      });
      createLog.save();
    }
    if (status == "CANCELED" && findOrderId && findPaymentId) {
      await Order.update(
        {
          status: OrderStatus.CUSTOMER_CANCELED,
        },
        {
          where: { id: Number(findOrderId.id) },
        }
      );
      await Payment.update(
        {
          status: PaymentStatus.FAILED,
        },
        {
          where: { orderId: Number(findOrderId.id) },
        }
      );
      const createLog = await OrderStatusHistory.create({
        orderId: findOrderId.id,
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.CUSTOMER_CANCELED,
        changedByType: ActorType.SYSTEM,
        source: "API",
        metadata: {},
      });
      await PaymentGatewayEvent.create({
        orderId: findOrderId.id,
        paymentId: findPaymentId.id,
        type: "NOTIFY",
        amountMinor: findOrderId.grandTotalMinor,
        provider: "DIGIPAY",
        status: "FAILED",
        reqJson: req.body,
        resJson: {},
      });
      createLog.save();
    }
    if (status == "FAILED" && findOrderId && findPaymentId) {
      await Order.update(
        {
          status: OrderStatus.CUSTOMER_CANCELED,
        },
        {
          where: { id: Number(findOrderId.id) },
        }
      );
      await Payment.update(
        {
          status: PaymentStatus.FAILED,
        },
        {
          where: { orderId: Number(findOrderId.id) },
        }
      );
      const createLog = await OrderStatusHistory.create({
        orderId: findOrderId.id,
        fromStatus: OrderStatus.PENDING,
        toStatus: OrderStatus.CUSTOMER_CANCELED,
        changedByType: ActorType.SYSTEM,
        source: "API",
        metadata: {},
      });
      await PaymentGatewayEvent.create({
        orderId: findOrderId.id,
        paymentId: findPaymentId.id,
        type: "NOTIFY",
        amountMinor: findOrderId.grandTotalMinor,
        provider: "DIGIPAY",
        status: "FAILED",
        reqJson: req.body,
        resJson: {},
      });
      createLog.save();
    }
  } catch (error) {
    res.json({ error: error });
  }
};

export const getCallBack = async (req: Request, res: Response) => {
  const orderId = req.query.order_id;
  const process_status = req.query.process_status;
  const reference = req.query.reference;
  const sign = req.query.sign;
  const findId = await Order.findOne({
    where: { reference: String(reference) },
    attributes: ["id", "status"],
  });
  //res.send(window.location.replace(`http://localhost:3000/digishop/order/${String(findId.id)}`))
  const linkResult = JSON.stringify(`http://localhost:3000/digishop/order/${String(findId?.id)}`)
  const link = JSON.stringify('http://localhost:3000')
  if (process_status == "true") {
    if (findId) {
      await Order.update(
        {
          status: OrderStatus.PAID,
        },
        {
          where: { id: Number(findId.id) },
        }
      );
      await Payment.update(
        {
          status: PaymentStatus.SUCCESS,
        },
        {
          where: { orderId: Number(findId.id) },
        }
      );
      res.send(`
          <html>
            <body>
              <script>
                location.replace(${linkResult})
              </script>
            </body>
          </html>
        `);
    }
  } else if (process_status == "false" && findId?.status != OrderStatus.PAID) {
    if (findId) {
      await Order.update(
        {
          status: OrderStatus.CUSTOMER_CANCELED, //system error in case notify mai send
        },
        {
          where: { id: Number(findId.id) },
        }
      );
      await Payment.update(
        {
          status: PaymentStatus.FAILED,
        },
        {
          where: { orderId: Number(findId.id) },
        }
      );
      res.send(`
          <html>
            <body>
              <script>
                location.replace(${linkResult})
              </script>
            </body>
          </html>
        `);
    }
  } else {
    res.send(`
          <html>
            <body>
              <script>
                location.replace(${link})
              </script>
            </body>
          </html>
        `);
  }
};

export const testRes = async(req: Request, res: Response) => {
  const link = JSON.stringify('http://localhost:3000')
  res.send(`
          <html>
            <body>
              <script>
                location.replace(${link});
              </script>
            </body>
          </html>
        `);
}