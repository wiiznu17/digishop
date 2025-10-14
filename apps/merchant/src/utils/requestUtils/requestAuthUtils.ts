import { RegisterData, StoreStatus, UserAuth } from "@/types/props/userProp"
import axios from "@/lib/axios"

export const createMerchant = async (data: RegisterData) => {
  return await new Promise((resolve, reject) => {
    axios
      .post("/api/merchant/register", data)
      .then((res) => {
        resolve(res.data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export async function fetchUser(): Promise<UserAuth | null> {
  try {
    const res = await axios.get("/api/auth/me", { withCredentials: true })
    console.log("success get auth")
    return res.data.user
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserAuth | null> {
  try {
    const res = await axios.post(
      "/api/auth/login",
      { email, password },
      { withCredentials: true }
    )
    console.log("success login")
    return res.data.user
  } catch (error) {
    console.error("Login error:", error)
    return null
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await axios.post("/api/auth/logout", null, { withCredentials: true })
  } catch (error) {
    console.error("Logout error:", error)
  }
}

export async function fetchStoreStatus(): Promise<StoreStatus | null> {
  try {
    const res = await axios.get("/api/merchant/store/status", {
      withCredentials: true
    })
    return (res.data?.status ?? null) as StoreStatus | null
  } catch (error) {
    console.error("Error fetching store status:", error)
    return null
  }
}
