import Axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosRequestHeaders
} from "axios"
import { getAccessToken, setAccessToken } from "./tokenStore"

// add a local config type to mark retries safely
type RetriableAxiosRequestConfig = AxiosRequestConfig & { _retry?: boolean }

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  withCredentials: true
})
const refreshClient = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  withCredentials: true
})

const REFRESH_SKIP = [
  /^\/api\/auth\/refresh$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/logout$/
]
// avoid attaching interceptors multiple times (HMR)
let interceptorsAttached = false

if (!interceptorsAttached) {
  interceptorsAttached = true

  let isRefreshing = false
  let pendingQueue: Array<() => void> = []

  axios.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      const headers: AxiosRequestHeaders = (config.headers ??
        {}) as AxiosRequestHeaders
      headers.Authorization = `Bearer ${token}`
      config.headers = headers
    }
    return config
  })

  axios.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const status = error.response?.status
      const original = (error.config ?? {}) as RetriableAxiosRequestConfig
      console.log('status',status)
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
          if (t) headers.Authorization = `${t}`
          original.headers = headers
          return axios(original)
        }
        
        try {
          isRefreshing = true
          original._retry = true

          const res = await refreshClient.post("/api/auth/refresh")
          const newAccess = (res.data as { accessToken?: string })?.accessToken
          if (!newAccess) throw new Error("no_access")

          setAccessToken(newAccess)
          pendingQueue.forEach((fn) => fn()) // i dont know
          pendingQueue = [] // i dont know

          const headers: AxiosRequestHeaders = (original.headers ??
            {}) as AxiosRequestHeaders
          headers.Authorization = `Bearer ${newAccess}`
          original.headers = headers // i dont know

          return axios(original) // i dont know
        } catch (e) {
          // refresh failed -> clear token; AuthGuard will redirect
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
