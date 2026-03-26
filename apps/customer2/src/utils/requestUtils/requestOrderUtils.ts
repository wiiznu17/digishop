import axios from "@/lib/axios"
import { CancelProp, Order, OrderIdProp, ShoppingCartProps } from "@/types/props/orderProp"
export const getShippingType = async() => {
    return await new Promise((resolve, reject) => {
        axios
            .get(`/api/customer/order/shiptype`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

export const deleteOrder = async(orderCode: string) => {
    return await new Promise((resolve, reject) => {
        axios   
            .patch(`/api/customer/order/delete/${orderCode}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

export const createOrderId = async(data: OrderIdProp) => {
    return await new Promise((resolve, reject) => {
        axios   
            .post(`/api/customer/order/create/id`,data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    }) 
    
}
export const createWishList = async(data: ShoppingCartProps) => {
    return await new Promise((resolve, reject) => {
        axios   
            .post(`/api/customer/order/create/cart`,data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    }) 
    
}

export const createOrder = async(data:Order) => {
    return await new Promise((resolve, reject) => {
        axios   
            .post(`/api/customer/order/create`,data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })  
}

export const fetchOrders = async(id:string, userId: number) => {
    return await new Promise((resolve,reject) => {
        axios
            .get(`/api/customer/order/${userId}/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const deleteCart = async(id: (number | undefined)[] | number) => {
    return await new Promise((resolve,reject) => {
        axios
            .post(`/api/customer/order/cart/id`, id)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const fetchUserOrders = async(id:number) => {
    return await new Promise((resolve,reject) => {
        axios
            .get(`/api/customer/order/user/id/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const fetchUserChart = async(id:number) => {
    return await new Promise((resolve,reject) => {
        axios 
            .get(`/api/customer/order/cart/user/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

export const updateOrderStatus = async(id: number) => {
    return await new Promise((resolve,reject) => {
        axios
            .patch(`/api/customer/order/status/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const cancelOrder = async(id: number,data: CancelProp ) => {
    return await new Promise((resolve, reject) => {
        axios
            .patch(`/api/customer/order/cancel/${id}`, data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

export const revokeCancelOrder = async(id: number) => {
    return await new Promise((resolve,reject) => {
        axios
            .post(`/api/customer/order/revoke/cancel/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

export const customerCancel = async(id: number) => {
    return await new Promise((resolve,reject) => {
        axios
            .patch(`/api/customer/order/customer/cancel/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}