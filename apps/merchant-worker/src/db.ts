import { checkDatabaseConnection, initModels, sequelize } from "@digishop/db";
import { logger } from "./logger";
// import { sequelize } from "@digishop/db/src/db";

export async function initDb() {
  // logger.info(
  //   { scope: "initDb", node: process.version, env: { DB_URL: process.env.DB_URL ? "set" : "missing" } },
  //   "Connecting DB…"
  // );
  await checkDatabaseConnection();
  initModels(sequelize);
  logger.info({ scope: "initDb" }, "DB connected");
}