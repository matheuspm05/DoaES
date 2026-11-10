import { createDatabase } from "./database/index.js";
import { seed } from "./database/seed.js";
import { createApp } from "./app.js";

const db = createDatabase();
seed(db);
const server = createApp(db).listen(3001, "localhost", () =>
  console.log("DoaES API: http://localhost:3001 - Modo demonstracao"),
);
function close() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
