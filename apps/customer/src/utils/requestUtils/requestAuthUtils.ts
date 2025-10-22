import axios from "@/lib/axios";
import { FormRegister } from "@/types/props/userProp";
export interface resetPasswordProps {
  email: string;
  password: string;
}
export interface sendResetProps {
  email: string;
}
export const createUser = async (data: FormRegister) => {
  return await new Promise((resolve, reject) => {
    axios
      .post(`/api/customer/verified-email`, data)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const resetPassword = async (
  data: string,
  token: string
) => {
  return await new Promise((resolve, reject) => {
    axios
      .patch(`/api/customer/reset-password`, {password: data , token})
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
export const verifiedEmail = async (
  token: string
) => {
  return await new Promise((resolve, reject) => {
    axios
      .post(`/api/customer/register`, {token})
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const sendResetPassword = async (data: string) => {
  console.log("data in util", data);
  return await new Promise((resolve, reject) => {
    axios
      .post('/api/customer/forgot-password', {email: data})
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

