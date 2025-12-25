import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { usersRoutes } from "./users";

export const apiRoutes = new Hono();

// GET /api/hello
apiRoutes.get("/hello", (c) => {
  return c.json({
    message: "Hello from Hono! 🔥",
    timestamp: new Date().toISOString(),
  });
});

// POST /api/echo
const echoSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

apiRoutes.post("/echo", zValidator("json", echoSchema), (c) => {
  const { message } = c.req.valid("json");
  return c.json({
    echo: `Server received: "${message}"`,
    originalLength: message.length,
    timestamp: new Date().toISOString(),
  });
});

// 挂载用户路由 (使用 Drizzle)
apiRoutes.route("/users", usersRoutes);

