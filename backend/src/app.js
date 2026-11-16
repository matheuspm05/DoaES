import { sessionMiddleware, csrf } from "./middleware/auth.js";
import express from "express";
import cors from "cors";
import { apiRoutes } from "./routes/api.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { readConfig } from "./config.js";
import { apiAccess, apiRateLimit } from "./middleware/apiAccess.js";
import { ApiError } from "./utils/errors.js";

export function createApp(db, config = readConfig()) {
  const app = express();
  app.disable("x-powered-by");
  // Secure cookies use server configuration, not visitor forwarded headers.
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    const origin = req.get("origin");
    if (origin && !config.allowedOrigins.includes(origin))
      return next(new ApiError(403, "Origem não permitida."));
    next();
  });
  app.use(
    cors({
      origin: config.allowedOrigins,
      methods: ["GET", "HEAD", "POST", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-Doaes-Key", "X-CSRF-Token"],
      credentials: true,
      maxAge: 600,
    }),
  );
  app.use("/api", apiAccess(config), apiRateLimit(config));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", sessionMiddleware(db, config), csrf, apiRoutes(db));
  app.use(errorHandler);
  return app;
}
