import { NextFunction, Response, Request, Router } from 'express'
import sequelize from '@digishop/db'
import userRouter from './routes/userRouter'
import productRouter from './routes/productRouter'
import bankRouter from './routes/bankRouter'
import orderRouter from './routes/orderRouter'
import storeRouter from './routes/storeRouter'
import carrierRouter from './routes/carrierRouter'
import ReturnCarrierRouter from './routes/returnCarrierRouter'
const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    await sequelize.authenticate()
    res.status(200).json({ database: 'Database connected' })
  } catch (error) {
    console.error('DB Error:', error)
    res.status(500).json({ database: 'Databas disconnected' })
  }
})

router.use('/merchant', userRouter)
router.use('/merchant/products', productRouter)
router.use('/merchant/bank-accounts', bankRouter)
router.use('/merchant/orders', orderRouter)
router.use('/merchant/store', storeRouter)
router.use('/merchant/transit', carrierRouter)
router.use('/merchant/return-transit', ReturnCarrierRouter)

export default router

