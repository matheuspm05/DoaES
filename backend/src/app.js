import express from "express";
import cors from "cors";
import { apiRoutes } from "./routes/api.js";

export function createApp(db) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", apiRoutes(db));
  app.use((error, _req, res, _next) => {
    const status = error.status ?? 500;
    if (status === 500) console.error(error);
    res
      .status(status)
      .json({
        erro:
          status === 500
            ? "Não foi possível concluir a operação."
            : status === 413
              ? "Dados excedem o limite de 100 KB."
              : status === 400 && error.type === "entity.parse.failed"
                ? "JSON inválido."
                : error.message,
      });
  });
  return app;
}
