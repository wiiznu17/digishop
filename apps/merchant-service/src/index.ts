import './helpers/dotenv.helper'
import { checkDatabaseConnection } from '@digishop/db'
import app from './app'

const PORT = Number(process.env.PORT) || 4003

async function main() {
  try {
    // Ensure DB connection before listening
    await checkDatabaseConnection()

    const server = app.listen(PORT, () => {
      console.log(`Merchant Service listening at: http://localhost:${PORT}`)
    })

    // Server error handling
    server.on('error', (err) => {
      console.error('❌ Server error:', err)
    })

    server.on('listening', () => {
      console.log('✅ Server is actively listening')
    })

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🔄 ${signal} received, shutting down gracefully...`)
      server.close((err) => {
        if (err) {
          console.error('Error during server shutdown:', err)
          process.exit(1)
        }
        console.log('Server closed')
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  } catch (err) {
    console.error('❌ Server failed to start:', err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Application failed:', err)
  process.exit(1)
})
