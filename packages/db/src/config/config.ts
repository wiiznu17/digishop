import dotenv from 'dotenv';
dotenv.config(); // โหลด .env ก่อนใช้

console.log('Loaded DB config:', {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
});

const configGroup = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql' as const,
  }
};

export type ConfigGroup = typeof configGroup;
export default configGroup;
module.exports = configGroup;
