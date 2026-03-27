import axios from "../lib/axios";

export const searchProduct = (query: string) =>
  axios.get(`/api/customer/product/search?query=${encodeURIComponent(query)}`).then((r) => r.data);

export const getProduct = (uuid: string) =>
  axios.get(`/api/customer/product/${uuid}`).then((r) => r.data);

export const getAllProducts = () =>
  axios.get(`/api/customer/product`).then((r) => r.data);

export const getStoreProduct = (uuid: string) =>
  axios.get(`/api/customer/store/${uuid}`).then((r) => r.data);
