import axios from "../lib/axios";
import { Address } from "../types";

export const getUserDetail = (id: number) =>
  axios.get(`/api/customer/detail/${id}`).then((r) => r.data);

export const getAddress = (id: number) =>
  axios.get(`/api/customer/address/${id}`).then((r) => r.data);

export const createAddress = (data: Address) =>
  axios.post(`/api/customer/address`, data).then((r) => r.data);

export const updateAddress = (userId: number, data: Address) =>
  axios.patch(`/api/customer/address/${userId}`, data).then((r) => r.data);

export const deleteAddress = (id: number) =>
  axios.delete(`/api/customer/address/${id}`).then((r) => r.data);

export const updateUserName = (id: number, data: { firstName: string; lastName: string; middleName?: string }) =>
  axios.patch(`/api/customer/name/${id}`, data).then((r) => r.data);
