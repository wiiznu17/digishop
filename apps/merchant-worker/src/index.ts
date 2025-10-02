import { initDb, startRefundWorker } from "./worker";

async function main() {
  await initDb();
  startRefundWorker();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
