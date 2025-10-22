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
      .catch(reject)
  })
}

export async function fetchUser(): Promise<UserAuth | null> {
  const has = !!getAccessToken()
  if (!has) return null
  try {
    const res = await axios.get("/api/auth/me")
    return res.data ?? null
  } catch {
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
    if (access) setAccessToken(access)
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
    return (res.data?.status ?? null) as StoreStatus | null
  } catch {
    return null
  }
}

// (optional) ถ้าจะมี bootstrap ใช้เองเฉพาะบาง flow; ไม่จำเป็นสำหรับ Lazy 401
export async function bootstrapAccess(): Promise<boolean> {
  if (getAccessToken()) return true
  try {
    const res = await axios.post("/api/auth/refresh", null)
    const newAccess = (res.data as { accessToken?: string })?.accessToken
    if (!newAccess) return false
    setAccessToken(newAccess)
    return true
  } catch {
    return false
  }
}
