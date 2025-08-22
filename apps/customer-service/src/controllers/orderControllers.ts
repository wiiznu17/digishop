import { Order } from "@digishop/db/src/models/Order";
import { OrderItem } from "@digishop/db/src/models/OrderItem";
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo";
import { ShippingType } from "@digishop/db/src/models/ShippingType";
import { OrderStatus ,ShippingStatus } from "@digishop/db/src/types/enum";
import { NextFunction, Request, Response  } from "express";


export const findOrder = async(req:Request , res:Response  , next: NextFunction) => {
    const id = req.params.id
    try {
        const getOrders = await Order.findByPk(id)
        return res.status(200).json({body: getOrders})
    } catch (error) {
        console.log('error',error)
    }
}
export const findUserOrder = async(req:Request , res:Response  , next: NextFunction) => {
    const id = req.params.id
    try {
        const getUserOrders = await Order.findAndCountAll({
            where: { customerId : id},
        })
        return res.status(200).json({body: getUserOrders})
    } catch (error) {
        console.log('error',error)
    }
}

export const createOrder = async(req:Request, res: Response,  next:NextFunction) => {
    const {
        customerId,
        storeId,
        totalPrice,
        productId,
        quantity,
        unitPrice,
        shippingTypeId,
        shippingAddress,
    } = req.body
    try {
        const orderData = await Order.create({
            customerId,
            storeId,
            totalPrice,
            status: OrderStatus.PENDING,
        })
        await OrderItem.create({
            orderId: orderData.id,
            productId,
            quantity,
            unitPrice
        })
        await ShippingInfo.create({
            orderId: orderData.id,
            shippingTypeId,
            shippingAddress,
            shippingStatus: ShippingStatus.PENDING
        })
        res.status(200).json({data: orderData})
    } catch (error) {
        res.json({error: error})
    }
    
}

export const deleteOrder = async(req:Request, res:Response,  next:NextFunction) => {
    try {
        return res.status(200).json({message:'connect del order'})
    } catch (error) {
        console.log('error', error)
    }
}

export const getShipping = async(req:Request, res:Response,  next:NextFunction) => {
    try {
        const data = await ShippingType.findAll()
        return res.json({data: data})
    } catch (error) {
        return res.json({error: error})
    }
}