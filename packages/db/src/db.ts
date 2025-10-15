import "dotenv/config";
import { Sequelize, Op } from "sequelize";

function parseDbUrl(url?: string) {
  if (!url) return null;
  const u = new URL(url);
  console.log(u)
  return {
    username: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    host: u.hostname,
    port: Number(u.port || 3306),
  };
}

const fromUrl = parseDbUrl(process.env.DB_URL);
const cfg = fromUrl ?? {
  username: process.env.DB_USERNAME ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "digishop",
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
};

console.log("DB target:", {
  host: cfg.host,
  database: cfg.database,
  username: cfg.username,
});

export const sequelize = process.env.DB_URL
  ? new Sequelize(process.env.DB_URL, {
      dialect: "mysql",
      logging: false,
      pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
    })
  : new Sequelize(cfg.database, cfg.username, cfg.password, {
      host: cfg.host,
      port: cfg.port,
      dialect: "mysql",
      logging: false,
      pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
    });

export async function checkDatabaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
}

export { Op };
