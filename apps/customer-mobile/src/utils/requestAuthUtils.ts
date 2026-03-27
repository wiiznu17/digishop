import axios from "../lib/axios";

export const loginUser = (email: string, password: string) =>
  axios.post(`/api/auth/login`, { email, password }, { withCredentials: true }).then((r) => r.data?.user ?? null);

export const logoutUser = () =>
  axios.post(`/api/auth/logout`).then((r) => r.data);

export const fetchUser = () =>
  axios.get(`/api/auth/me`).then((r) => r.data);

export const createUserRequest = (data: any) =>
  axios.post(`/api/customer/verified-email`, data).then((r) => r.data);

export const verifiedEmail = (token: string) =>
  axios.post(`/api/customer/register`, { token }).then((r) => r.data);

export const sendResetPassword = (email: string) =>
  axios.post(`/api/customer/forgot-password`, { email }).then((r) => r.data);

export const resetPassword = (password: string, token: string) =>
  axios.patch(`/api/customer/reset-password`, { password, token }).then((r) => r.data);
