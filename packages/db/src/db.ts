import { Sequelize, Op } from 'sequelize';
import { ConfigGroup } from './config/config';
const configGroup = require('../src/config/config');

const env = (process.env.NODE_ENV || 'development') as keyof ConfigGroup;
const config = configGroup[env];

console.log('Loaded DB from config:', {
  username: config.username,
  password: config.password,
  databaseReal: config.database,
  host: config.host,
});

export const sequelize = new Sequelize({
  database: config.database,
  username: config.username,
  password: config.password,
  host: config.host,
  dialect: 'mysql',
  logging: false,
});

export async function checkDatabaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    // await sequelize.sync(); // รอ sync ให้เสร็จก่อน
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

export { Op };

