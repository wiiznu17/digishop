import { Op } from "@digishop/db/src/db";
import { Address } from "@digishop/db/src/models/Address";
import { Order } from "@digishop/db/src/models/Order";
import { OrderItem } from "@digishop/db/src/models/OrderItem";
import { Product } from "@digishop/db/src/models/Product";
import { Store } from "@digishop/db/src/models/Store";
import { OrderStatus, ProductStatus, StoreStatus } from "@digishop/db/src/types/enum";
import { NextFunction, Request, Response  } from "express";


export const findOrder = async(req:Request , res:Response  , next: NextFunction) => {
    const id = req.params.id
    try {
        const getOrders = await Order.findAndCountAll({
            where: { customerId : id},
        })
        return res.status(200).json({body: getOrders})
    } catch (error) {
        console.log('error',error)
    }
}
export const findUserOrder = async(req:Request , res:Response  , next: NextFunction) => {
    const id = req.params.id
    try {
        const getOrders = await Order.findAndCountAll({
            where: { customerId : id},
        })
        return res.status(200).json({body: getOrders})
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
        unitPrice
    } = req.body
    try {
        const orderData = await Order.create({
            customerId,
            storeId,
            totalPrice,
            status: OrderStatus.PENDING,
        })
        const cons = await orderData.save()
        res.json({data: 'success'})
        try {
            const orderItemData = await OrderItem.create({
                orderId: cons.id,
                productId,
                quantity,
                unitPrice
            })
            await orderItemData.save()
        } catch (error) {        
            res.json({error: error})
        }
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