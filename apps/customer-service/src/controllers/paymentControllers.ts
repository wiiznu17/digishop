import { Order } from "@digishop/db/src/models/Order"
import { Payment } from "@digishop/db/src/models/Payment";
import { OrderStatus, PaymentStatus } from "@digishop/db/src/types/enum"
import axios from "axios";
import { Request, Response } from "express"
export const getNotify = async (req: Request, res: Response) => {
  const {timestamp, reference,mid,payment_type,order_id,amount,currency,approval_code,status,bank_reference,authorize_token} = req.body
  try{
    console.log('order status',req.body)
  }catch(error){
    console.log('error',error)
  }
  try {
    console.log(status)
    const findId = await Order.findOne({
      where: {reference: String(reference)},
      attributes: ['id']
    })
    if(findId){
      const data = await Payment.update(
        { 
          pgwStatus: status,
         },{
        where: { 
          orderId: Number(findId.id)
        }
      })
    }
    if(status == 'APPROVED' && findId){
      await Order.update({
        status: OrderStatus.PAID
      },{
        where: {id: Number(findId.id)}
      })
      await Payment.update({
        status: PaymentStatus.SUCCESS
      },{
        where: {orderId: Number(findId.id)}
      })
    }
    if(status == 'CANCELED' && findId){
      await Order.update({
        status: OrderStatus.CUSTOMER_CANCELED
      }
      ,{
        where: {id: Number(findId.id)}
      })
      await Payment.update({
        status: PaymentStatus.FAILED
      },{
        where: {orderId: Number(findId.id)}
      })
    }
    if(status == 'FAILED' && findId){
      await Order.update({
        status: OrderStatus.CUSTOMER_CANCELED
      },{
        where: {id: Number(findId.id)}
      })
      await Payment.update({
        status: PaymentStatus.FAILED
      },{
        where: {orderId: Number(findId.id)}
      })
    }
  } catch (error) {
    res.json({error: error})
  }
}


export const getCallBack = async (req: Request, res: Response) => {
  const orderId = req.query.order_id
  const process_status = req.query.process_status
  const reference = req.query.reference
  const sign = req.query.sign
  if(process_status == 'true'){
    const findId = await Order.findOne({
      where: {reference: String(reference)},
      attributes: ['id']
    })
    if(findId){
    await Order.update({
        status: OrderStatus.PAID
      },{
        where: {id: Number(findId.id)}
      })
      await Payment.update({
        status: PaymentStatus.SUCCESS
      },{
        where: {orderId: Number(findId.id)}
      })
    }
    res.redirect('http://localhost:3000/digishop/order/success')
  }else if(process_status == 'false'){
    res.redirect('http://localhost:3000/digishop/order/failed')
  }
}
