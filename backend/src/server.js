import "dotenv/config";
import { createDatabase } from "./database/index.js";
import { seed } from "./database/seed.js";
import { createApp } from "./app.js";
import { readConfig } from "./config.js";

const config = readConfig();
const db = createDatabase(process.env.SQLITE_PATH);
seed(db);
const server = createApp(db, config).listen(config.port, config.host, () =>
  console.log(`DoaES API na porta ${config.port} - Modo demonstracao`),
);
function close() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
