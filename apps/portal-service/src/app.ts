import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import router from './iamRouter'
import { initModels, sequelize } from '@digishop/db'
import { errorHandler } from './middlewares/errorHandler'
const cookieParser = require('cookie-parser')

const app: Express = express()

// Must come before other middleware that reads req.ip / use rate-limit
app.set('trust proxy', 1)

app.disable('x-powered-by')
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// CORS: Support multiple origins from env (separated by comma)
const ALLOW_ORIGIN = (process.env.ALLOW_CORS ?? '').trim()
const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (process.env.NODE_ENV === 'test') return cb(null, true)
    if (origin === ALLOW_ORIGIN) return cb(null, true)
    return cb(new Error('Not allowed by CORS: ' + origin))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'Accept',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 204
})

app.use((req, res, next) => {
  res.header('Vary', 'Origin')
  next()
})

app.use(corsMiddleware)

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 0 : 30000, // Disable rate limit in test or set very high
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test'
})
app.use(limiter)

// Logging middleware (simplified for test)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[PORTAL] Incoming', req.method, req.url)
  }
  next()
})

initModels(sequelize)
app.use('/api', router)
app.use(errorHandler)

export default app
