import axios from "@/lib/axios"
import { FormRegister } from "@/types/props/userProp"
const endpoint = 'http://localhost:4003'
export const createUser = async (data: FormRegister) => {
  return await new Promise((resolve, reject) => {
    axios
      .post(`${endpoint}/api/customer/register`, data)
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
