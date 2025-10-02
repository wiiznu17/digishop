import axios from "axios";
import { ENV } from "./env";

export const http = axios.create({
  baseURL: ENV.MERCHANT_BASE,
  timeout: 15000
});

export function svcHeaders(correlationId?: string) {
  return {
    Authorization: `Bearer ${ENV.MERCHANT_SERVICE_TOKEN}`,
    "Content-Type": "application/json",
    ...(correlationId ? { "X-Request-Id": correlationId } : {})
  };
}
