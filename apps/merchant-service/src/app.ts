import express, { Express } from 'express'
import cors from 'cors'
import router from './iamRouter'
import { initModels, sequelize } from '@digishop/db'
import { errorHandler } from './middlewares/errorHandler'
const cookieParser = require('cookie-parser')

const app: Express = express()

// Middlewares
app.use(express.json())
app.use(cookieParser())

// Initialize models
initModels(sequelize)

// Logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[MERCHANT] Incoming', req.method, req.url)
  }
  next()
})

// Main Router
app.use('/api', router)

// Global Error Handler
app.use(errorHandler)

export default app
