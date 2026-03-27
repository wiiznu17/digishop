import dotenv from 'dotenv'
dotenv.config() // โหลด .env ก่อนใช้

const envVar = process.env.DB_URL ? 'DB_URL' : undefined

console.log('Loaded DB config:', {
  use_env_variable: envVar,
  username: process.env.DB_USERNAME,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST
})

// Sequelize CLI ใช้ค่าจาก use_env_variable ถ้ามี DB_URL
const configGroup = {
  development: envVar
    ? {
        use_env_variable: envVar,
        dialect: 'mysql' as const
      }
    : {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'mysql' as const
      },

  production: envVar
    ? {
        use_env_variable: envVar,
        dialect: 'mysql' as const
      }
    : {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'mysql' as const
      }
}

export type ConfigGroup = typeof configGroup
export default configGroup
module.exports = configGroup
