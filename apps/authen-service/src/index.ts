import express from 'express'
import './helpers/dotenv.helper'
import authRoutes from './routes/authRouter'
import { checkDatabaseConnection, initModels, sequelize } from '@digishop/db'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/errorHandler'

async function main() {
  try {
    await checkDatabaseConnection()
    const app = express()
    app.set('trust proxy', 1)

    app.use(cookieParser())
    app.use(express.json())

    app.use((req, _res, next) => {
      console.log(
        '[AUTH] Incoming',
        req.method,
        'payload: ',
        req.body,
        'URL:',
        req.url,
        'Origin:',
        req.headers.origin
      )
      next()
    })

    initModels(sequelize)

    app.use('/api/auth', authRoutes)

    // Centralized error handler — must be last
    app.use(errorHandler)

    const PORT = Number(process.env.PORT)
    app.listen(PORT, () => {
      console.log(`[AuthService] Running on port ${PORT}`)
    })
  } catch (err) {
    console.error('❌ Server failed to start:', err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Application failed:', err)
  process.exit(1)
})
