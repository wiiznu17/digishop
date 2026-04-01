import app from './app'
import './helpers/dotenv.helper'
import { checkDatabaseConnection, sequelize } from '@digishop/db'
import { ensureRedis } from './lib/redis'

const PORT = Number(process.env.PORT) || 4001

async function main() {
  try {
    await checkDatabaseConnection()
    await ensureRedis()

    const server = app.listen(PORT, () => {
      console.log(`Portal Service listening at: http://localhost:${PORT}`)
    })

    server.on('error', (err) => {
      console.error('❌ Server error:', err)
    })

    server.on('listening', () => {
      console.log('✅ Server is actively listening')
    })

    const gracefulShutdown = (signal: string) => {
      console.log(`\n🔄 ${signal} received, shutting down gracefully...`)
      server.close((err) => {
        if (err) {
          console.error('Error during server shutdown:', err)
          process.exit(1)
        }
        console.log('Server closed')
        sequelize.close()
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    return new Promise((resolve, reject) => {
      server.on('error', reject)
      // No resolve to keep the process running
    })
  } catch (err) {
    console.error('❌ Server failed to start:', err)
    throw err
  }
}

main().catch((err) => {
  console.error('Application failed:', err)
  process.exit(1)
})
