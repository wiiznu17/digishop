import dotenv from "dotenv"
dotenv.config()

export const config = {
  port: process.env.PORT,
  corsOrigin: process.env.CORS_ORIGIN?.split(","),
  services: {
    auth: process.env.AUTH_SERVICE,
    merchant: process.env.MERCHANT_SERVICE,
    customer: process.env.CUSTOMER_SERVICE,
    admin: process.env.ADMIN_SERVICE
  }
}
