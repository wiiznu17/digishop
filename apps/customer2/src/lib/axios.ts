import Axios, {
  AxiosError,
  AxiosRequestConfig,
} from "axios"
// import { getAccessToken, setAccessToken } from "./tokenStore"

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
        original._retry = true
        try{
          await refreshClient.post("/api/auth/refresh")
          return axios(original)
        } catch (e){
          return Promise.reject(e)
        }
      
      }
      return Promise.reject(error)
    }
  )
}

export default axios
