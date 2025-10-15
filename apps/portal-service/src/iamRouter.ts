import express, { NextFunction, Response, Request, Router } from 'express'
import  {sequelize } from '@digishop/db'
// import userRouter from './routes/userRouter'
import categoryRouter from './routes/categoryRouter'
import productRouter from './routes/productRouter'
import orderRouter from './routes/orderRouter'
import authRouter from './routes/authRouter';
import refundRouter from './routes/refundRouter';
import userRouter from './routes/userRouter';
import storeRouter from './routes/storeRouter';
import adminUserRouter from './routes/adminUserRouter';
import rolesRouter from './routes/adminRoleRouter';
import auditLogRouter from './routes/auditLogRouter';
import dashboardRouter from './routes/dashBoardRouter';
import analyticsRouter from './routes/analyticsRouter';

import { authenticateAdmin, requirePerms } from './middlewares/auth';

const router: express.Router = express.Router();

router.get('/', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ database: 'Database connected' });
  } catch (error) {
    res.status(500).json({ database: 'Database disconnected' });
  }
});

router.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
// router.use('/user', userRouter);

router.use('/admin', authenticateAdmin);

router.use('/admin/categories', categoryRouter);
router.use('/admin/products', productRouter);
router.use('/admin/orders', orderRouter);
router.use('/admin/refunds', refundRouter);
router.use('/admin/users', userRouter);
router.use('/admin/stores', storeRouter);
router.use('/admin/admins', adminUserRouter);
router.use('/admin/roles', rolesRouter);
router.use('/admin/audit-logs', auditLogRouter);
router.use('/admin/dashboards', dashboardRouter);
router.use('/admin/analytics', analyticsRouter);

router.use('/auth', authRouter);

export default router

