import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { apiRoutes } from "./routes";

// 创建基础 app
const baseApp = new Hono();

// Middlewares
baseApp.use("*", logger());
baseApp.use("*", prettyJSON());
baseApp.use(
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

// 使用链式调用保持类型安全
export const app = baseApp
  // API 路由
  .route("/api", apiRoutes)
  // Health check
  .get("/health", (c) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

// 404 Handler (需要单独添加，不影响类型)
baseApp.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `Route ${c.req.path} not found`,
    },
    404
  );
});

// Error Handler
baseApp.onError((err, c) => {
  console.error(`${err}`);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
    },
    500
  );
});

// 导出 App 类型供客户端使用
export type AppType = typeof app;
