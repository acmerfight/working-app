import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { usersRoutes } from "./users";

// 使用链式调用保持类型安全
const apiRoutes = new Hono()
  // GET /api/hello
  .get("/hello", (c) => {
    return c.json({
      message: "Hello from Hono! 🔥",
      timestamp: new Date().toISOString(),
    });
  })
  // POST /api/echo
  .post(
    "/echo",
    zValidator(
      "json",
      z.object({
        message: z.string().min(1, "Message is required"),
      })
    ),
    (c) => {
      const { message } = c.req.valid("json");
      return c.json({
        echo: `Server received: "${message}"`,
        originalLength: message.length,
        timestamp: new Date().toISOString(),
      });
    }
  )
  // 挂载用户路由 (使用 Drizzle)
  .route("/users", usersRoutes);

// 导出路由和类型
export { apiRoutes };
export type ApiRoutesType = typeof apiRoutes;
