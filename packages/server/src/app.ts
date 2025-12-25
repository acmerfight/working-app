import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { apiRoutes } from "./routes";

export const app = new Hono();

// Middlewares
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true,
  })
);

// Routes
app.route("/api", apiRoutes);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `Route ${c.req.path} not found`,
    },
    404
  );
});

// Error Handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
    },
    500
  );
});

export type AppType = typeof app;

