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
      .post(`/api/customer/register`, data)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const resetPassword = async (
  data: resetPasswordProps,
  token: string
) => {
  return await new Promise((resolve, reject) => {
    axios
      .patch(`/api/customer/refresh-password/${token}`, data)
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
      .post("/api/customer/forgot-password", data)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
