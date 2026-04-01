import app from './app'
import { checkDatabaseConnection, sequelize } from '@digishop/db'

const PORT = Number(process.env.PORT) || 3000

async function main() {
  try {
    await checkDatabaseConnection()

    const server = app.listen(PORT, () => {
      console.log(`Customer Service 2 listening at: http://localhost:${PORT}`)
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
        sequelize.close()
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // Keep process alive
    return new Promise((resolve, reject) => {
      server.on('error', reject)
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
