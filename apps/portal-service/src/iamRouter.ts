import { NextFunction, Response, Request, Router } from 'express'
import sequelize from '@digishop/db'
// import userRouter from './routes/userRouter'
import categoryRouter from './routes/categoryRouter'
import productRouter from './routes/productRouter'
import orderRouter from './routes/orderRouter'
import authRouter from './routes/authRouter';
import refundRouter from './routes/refundRouter';

import { authenticateAdmin, requirePerms } from './middlewares/auth';

const router = Router()

router.get('/', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ database: 'Database connected' });
  } catch (error) {
    res.status(500).json({ database: 'Database disconnected' });
  }
});

// router.use('/user', userRouter);

router.use('/admin', authenticateAdmin);

router.use('/admin/categories', categoryRouter);
router.use('/admin/products', productRouter);
router.use('/admin/orders', orderRouter);
router.use('/admin/refunds', refundRouter);

router.use('/auth', authRouter);

export default router

