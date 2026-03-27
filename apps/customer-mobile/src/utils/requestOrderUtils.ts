import axios from '../lib/axios'

export const getShippingType = () =>
  axios.get(`/api/customer/order/shiptype`).then((r) => r.data)

export const createOrderId = (data: { customerId: number; orderData: any[] }) =>
  axios.post(`/api/customer/order/create/id`, data).then((r) => r.data)

export const createWishList = (data: {
  customerId: number
  productItemId: number[]
  quantity: number[]
}) => axios.post(`/api/customer/order/create/cart`, data).then((r) => r.data)

export const createOrder = (data: any) =>
  axios.post(`/api/customer/order/create`, data).then((r) => r.data)

export const fetchOrders = (id: string, userId: number) =>
  axios.get(`/api/customer/order/${userId}/${id}`).then((r) => r.data)

export const deleteCart = (ids: number[]) =>
  axios.post(`/api/customer/order/cart/id`, ids).then((r) => r.data)

export const fetchUserOrders = (id: number) =>
  axios.get(`/api/customer/order/user/id/${id}`).then((r) => r.data)

export const fetchUserCart = (id: number) =>
  axios.get(`/api/customer/order/cart/user/${id}`).then((r) => r.data)

export const updateOrderStatus = (id: number) =>
  axios.patch(`/api/customer/order/status/${id}`).then((r) => r.data)

export const cancelOrder = (
  id: number,
  data: { reason?: string; description?: string; contactEmail?: string }
) => axios.patch(`/api/customer/order/cancel/${id}`, data).then((r) => r.data)

export const revokeCancelOrder = (id: number) =>
  axios.post(`/api/customer/order/revoke/cancel/${id}`).then((r) => r.data)

export const customerCancel = (id: number) =>
  axios.patch(`/api/customer/order/customer/cancel/${id}`).then((r) => r.data)

export const deleteOrder = (orderCode: string) =>
  axios.patch(`/api/customer/order/delete/${orderCode}`).then((r) => r.data)
