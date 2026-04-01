import express from 'express'
import cors from 'cors'
import router from './iamRouter'
import './helpers/dotenv.helper'
import { initModels, sequelize } from '@digishop/db'
import { errorHandler } from './middlewares/errorHandler'
const cookieParser = require('cookie-parser')

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true
  })
)

initModels(sequelize)

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[Customer2] Incoming', req.method, req.url)
  }
  next()
})

app.use('/api', router)
app.use('/', router)

app.use(errorHandler as any)

export default app
