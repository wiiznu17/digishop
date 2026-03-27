import Axios, { AxiosError, AxiosRequestConfig } from "axios";

type RetriableAxiosRequestConfig = AxiosRequestConfig & { _retry?: boolean };

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

const axios = Axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

const refreshClient = Axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const REFRESH_SKIP = [
  /^\/api\/auth\/refresh$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/logout$/,
];

let interceptorsAttached = false;
if (!interceptorsAttached) {
  interceptorsAttached = true;
  axios.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const original = (error.config ?? {}) as RetriableAxiosRequestConfig;
      const path = original?.url || "";
      if (REFRESH_SKIP.some((re) => re.test(path))) return Promise.reject(error);
      if (status === 401 && !original._retry) {
        original._retry = true;
        try {
          await refreshClient.post("/api/auth/refresh");
          return axios(original);
        } catch (e) {
          return Promise.reject(e);
        }
      }
      return Promise.reject(error);
    }
  );
}

export default axios;
