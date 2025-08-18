import axios from "@/lib/axios"
import { FormRegister } from "@/types/props/userProp"
export const createUser = async (data: FormRegister) => {
  return await new Promise((resolve, reject) => {
    axios
      .post("http://localhost:4002/api/customer/register", data)
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
