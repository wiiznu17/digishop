import express, { type Request, type Response } from "express";
import userRouter from "./routes/userRouter";
import productRouter from "./routes/productRouter";
import bankRouter from "./routes/bankRouter";
import orderRouter from "./routes/orderRouter";
import storeRouter from "./routes/storeRouter";
import carrierRouter from "./routes/carrierRouter";
import ReturnCarrierRouter from "./routes/returnCarrierRouter";
import DashboardRouter from "./routes/dashboardRouter";
import { sequelize } from "@digishop/db";

const router: express.Router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ database: "Database connected" });
  } catch (error) {
    console.error("DB Error:", error);
    res.status(500).json({ database: "Database disconnected" });
  }
});
router.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

router.use("/merchant", userRouter);
router.use("/merchant/products", productRouter);
router.use("/merchant/bank-accounts", bankRouter);
router.use("/merchant/orders", orderRouter);
router.use("/merchant/store", storeRouter);
router.use("/merchant/transit", carrierRouter);
router.use("/merchant/return-transit", ReturnCarrierRouter);
router.use("/merchant/dashboard", DashboardRouter);

export default router;
