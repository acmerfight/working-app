import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { authRoutes } from "./auth";
import { calendarsRoutes } from "./calendars";
import { eventsRoutes } from "./events";
import { remindersRoutes } from "./reminders";
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
  // 挂载认证路由
  .route("/auth", authRoutes)
  // 挂载用户路由 (使用 Drizzle)
  .route("/users", usersRoutes)
  // 挂载日历路由
  .route("/calendars", calendarsRoutes)
  // 挂载事件路由
  .route("/events", eventsRoutes)
  // 挂载提醒路由
  .route("/reminders", remindersRoutes);

// 导出路由和类型
export { apiRoutes };
export type ApiRoutesType = typeof apiRoutes;
