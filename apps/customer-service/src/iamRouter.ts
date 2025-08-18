import { NextFunction, Response, Request, Router } from 'express'
import sequelize from '@digishop/db'
import userRouter from './routes/userRouter'
import productRouter from './routes/productRouter'
import orderRouter from './routes/orderRouter'

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

router.use('/customer', userRouter)
router.use('/product', productRouter)
router.use('/order', orderRouter)

export default router

