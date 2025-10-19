
import { ActorType, CheckOut, Order, OrderStatus, OrderStatusHistory, Payment, PaymentGatewayEvent, PaymentStatus } from "@digishop/db";
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
  console.log('req',req.body)
  try {
    const findPaymentId = await Payment.findOne({
      where: { providerRef: reference },
      attributes: ["id","checkoutId"],
    });
    const checkOutId = findPaymentId?.checkoutId
    const paymentId = findPaymentId?.id
    const findOrder = await Order.findAll({
      where: { checkoutId: checkOutId},
      attributes: ["id"]
    })
    if (checkOutId) {
      const data = await Payment.update(
        {
          pgwStatus: status,
          pgwPayload: {
            "status": status,
            "checkoutId": checkOutId
          }
        },
        {
          where: {
            checkoutId: checkOutId,
          },
        }
      );
    }
    if (status == "APPROVED" && checkOutId && paymentId) {
      await Order.update(
        {
          status: OrderStatus.PAID,
        },
        {
          where: { checkoutId: checkOutId},
        }
      );
      await Payment.update(
        {
          status: PaymentStatus.SUCCESS,
          paidAt: timestamp
        },
        {
          where: { checkoutId: checkOutId},
        }
      );
      //ต้อง loop
      for(let i = 0 ; i < findOrder.length ; i++){
        let createLog = await OrderStatusHistory.create({
          orderId: findOrder[i].id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.PAID,
          changedByType: ActorType.SYSTEM,
          source: "API",
          metadata: {},
        });
        createLog.save();
      }
      await PaymentGatewayEvent.create({
        checkoutId: checkOutId,
        paymentId: paymentId, //
        type: "NOTIFY",
        amountMinor: amount*100, //
        provider: "DIGIPAY",
        status: "SUCCESS",
        reqJson: req.body,
        resJson: {},
      });
    }
    if (status == "CANCELED" && checkOutId && paymentId) {
      await Order.update(
        {
          status: OrderStatus.CUSTOMER_CANCELED,
        },
        {
          where: { checkoutId: checkOutId},
        }
      );
      await Payment.update(
        {
          status: PaymentStatus.FAILED,
        },
        {
          where: { checkoutId: checkOutId },
        }
      );
      for(let i = 0 ; i <  findOrder.length ; i++){
        let createLog = await OrderStatusHistory.create({
          orderId: findOrder[i].id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.CUSTOMER_CANCELED,
          changedByType: ActorType.SYSTEM,
          source: "API",
          metadata: {},
        });
        createLog.save();
      }
      await PaymentGatewayEvent.create({
        checkoutId: checkOutId,
        paymentId: paymentId,
        type: "NOTIFY",
        amountMinor: amount*100,
        provider: "DIGIPAY",
        status: "CANCELED",
        reqJson: req.body,
        resJson: {},
      });
    }
    if (status == "FAILED" && checkOutId && paymentId) {
      await Order.update(
        {
          status: OrderStatus.CUSTOMER_CANCELED,
        },
        {
          where: {checkoutId: checkOutId},
        }
      );
      await Payment.update(
        {
          status: PaymentStatus.FAILED,
        },
        {
          where: {checkoutId: checkOutId},
        }
      );
      for(let i = 0 ; i < findOrder.length ; i++){
        let createLog = await OrderStatusHistory.create({
          orderId: findOrder[i].id,
          fromStatus: OrderStatus.PENDING,
          toStatus: OrderStatus.CUSTOMER_CANCELED,
          changedByType: ActorType.SYSTEM,
          source: "API",
          metadata: {},
        });
        createLog.save();
      }
      await PaymentGatewayEvent.create({
        checkoutId: checkOutId,
        paymentId: paymentId,
        type: "NOTIFY",
        amountMinor: amount*100,
        provider: "DIGIPAY",
        status: "FAILED",
        reqJson: req.body,
        resJson: {},
      });
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
  const findId = await Payment.findOne({
    where: { providerRef: String(reference) },
    attributes: ["id", "checkoutId"],
  });
  if(!findId)return
  const orderCode = await CheckOut.findOne({
    where: {id: findId?.checkoutId} , attributes: ["orderCode"]
  })
  const linkResult = JSON.stringify(`${process.env.WEBSITE_CUSTOMER_URL}/order/${String(orderCode?.orderCode)}`)
  const link = JSON.stringify(process.env.WEBSITE_CUSTOMER_URL)
  if (process_status == "true") {
    if (findId) {
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
  } else if (process_status == "false") {
    if (findId) {
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
