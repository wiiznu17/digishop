import { RegisterData } from "@/types/props/userProp"
import axios from "axios"

export const createMerchant = async (data: RegisterData) => {
  return axios.post("/api/merchant/register", data)
}
