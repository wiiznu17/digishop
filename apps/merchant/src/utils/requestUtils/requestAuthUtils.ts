import axios from "@/lib/axios"
import { setAccessToken, getAccessToken } from "@/lib/tokenStore"
import { RegisterData, StoreStatus, UserAuth } from "@/types/props/userProp"

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
  const has = !!getAccessToken()
  if (!has) return null
  try {
    const res = await axios.get("/api/auth/me")
    console.log("fetchUser response:", res.data)
    return res.data ?? null
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
    const res = await axios.post("/api/auth/login", { email, password })
    const access = res.data.accessToken as string | undefined
    console.log("loginUser accessToken:", access)
    if (access) {
      setAccessToken(access)
    }
    console.log("loginUser response user:", res.data.user)
    return res.data.user ?? null
  } catch {
    return null
  }
}

export async function logoutUser() {
  try {
    await axios.post("/api/auth/logout")
  } finally {
    setAccessToken(null)
  }
}

export async function fetchStoreStatus(): Promise<StoreStatus | null> {
  try {
    const res = await axios.get("/api/merchant/store/status")
    console.log("fetchStoreStatus:", res.data.status)
    return (res.data?.status ?? null) as StoreStatus | null
  } catch (error) {
    console.error("Error fetching store status:", error)
    return null
  }
}

export async function bootstrapAccess(): Promise<boolean> {
  if (getAccessToken()) return true // มี access อยู่แล้ว
  try {
    console.log("bootstrapAccess(): trying to refresh access token")
    const res = await axios.post("/api/auth/refresh", null)
    const newAccess = (res.data as { accessToken?: string })?.accessToken
    console.log("bootstrapAccess(): refresh response accessToken:", newAccess)
    if (!newAccess) return false
    setAccessToken(newAccess)
    console.log("bootstrapAccess(): got new access token")
    return true
  } catch (err) {
    console.warn("bootstrapAccess() failed:", err)
    return false
  }
}
