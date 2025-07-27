import dotenv from "dotenv"
dotenv.config()

export const config = {
  port: process.env.PORT || 8080,
  corsOrigin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  services: {
    auth: process.env.AUTH_SERVICE || "http://localhost:4000",
    merchant: process.env.MERCHANT_SERVICE || "http://localhost:4001",
    customer: process.env.CUSTOMER_SERVICE || "http://localhost:4002",
    admin: process.env.ADMIN_SERVICE || "http://localhost:4003",
  }
}
