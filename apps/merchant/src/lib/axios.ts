import Axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosRequestHeaders
} from "axios"
import { getAccessToken, setAccessToken } from "./tokenStore"

type RetriableAxiosRequestConfig = AxiosRequestConfig & { _retry?: boolean }

export const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  withCredentials: true
})

const refreshClient = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  withCredentials: true
})

/**
 * เรียก refresh แบบ one-shot โดยไม่มี interceptor (กันลูป)
 * สำเร็จ: คืน accessToken ใหม่ และ set เข้าร้านค้า
 * ล้มเหลว: คืน null
 */
export async function tryRefreshOnce(): Promise<string | null> {
  try {
    const res = await refreshClient.post("/api/auth/refresh")
    const newAccess = (res.data as { accessToken?: string })?.accessToken
    if (!newAccess) return null
    setAccessToken(newAccess)
    return newAccess
  } catch {
    return null
  }
}

// กันการ refresh ซ้ำซ้อนกับ endpoint พิเศษพวกนี้
const REFRESH_SKIP = [
  /^\/api\/auth\/refresh$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/logout$/
]

let interceptorsAttached = false

if (!interceptorsAttached) {
  interceptorsAttached = true

  let isRefreshing = false
  let pendingQueue: Array<() => void> = []

  // เติม Authorization จาก access token ปัจจุบัน ให้ทุกรีเควสต์
  axios.interceptors.request.use((config) => {
    const t = getAccessToken()
    if (t) {
      const headers: AxiosRequestHeaders = (config.headers ??
        {}) as AxiosRequestHeaders
      headers.Authorization = `Bearer ${t}`
      config.headers = headers
    }
    return config
  })

  // จัดการ 401 → refresh + retry อัตโนมัติ (คิวรอถ้ามีหลายรีเควสต์ชนกัน)
  axios.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const status = error.response?.status
      const original = (error.config ?? {}) as RetriableAxiosRequestConfig

      const path = original?.url || ""
      if (REFRESH_SKIP.some((re) => re.test(path))) {
        return Promise.reject(error)
      }

      if (status === 401 && !original._retry) {
        if (isRefreshing) {
          await new Promise<void>((resolve) => pendingQueue.push(resolve))
          original._retry = true
          const t = getAccessToken()
          const headers: AxiosRequestHeaders = (original.headers ??
            {}) as AxiosRequestHeaders
          if (t) headers.Authorization = `Bearer ${t}`
          original.headers = headers
          return axios(original)
        }

        try {
          isRefreshing = true
          original._retry = true

          const newAccess = await tryRefreshOnce()
          if (!newAccess) throw new Error("no_access")

          pendingQueue.forEach((fn) => fn())
          pendingQueue = []

          const headers: AxiosRequestHeaders = (original.headers ??
            {}) as AxiosRequestHeaders
          headers.Authorization = `Bearer ${newAccess}`
          original.headers = headers

          return axios(original)
        } catch (e) {
          // refresh ล้มเหลว → เคลียร์ access; ให้ AuthProvider จัดการ redirect ผ่าน subscribe
          setAccessToken(null)
          pendingQueue.forEach((fn) => fn())
          pendingQueue = []
          return Promise.reject(e)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    }
  )
}

export default axios
