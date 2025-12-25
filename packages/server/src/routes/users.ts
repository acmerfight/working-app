import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { insertUserSchema, users } from "../db/schema";

// Path 参数 schema - 类型安全的 ID 验证
const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// 创建用户 schema
const createUserSchema = insertUserSchema.pick({
  name: true,
  email: true,
});

// 更新用户 schema
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

// 使用链式调用保持类型安全
export const usersRoutes = new Hono()
  // GET /users - 获取所有用户
  .get("/", async (c) => {
    const allUsers = await db.select().from(users);
    return c.json({ users: allUsers });
  })
  // GET /users/:id - 获取单个用户
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (user.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user: user[0] });
  })
  // POST /users - 创建用户
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json");

    const newUser = await db.insert(users).values(data).returning();

    return c.json({ user: newUser[0] }, 201);
  })
  // PUT /users/:id - 更新用户
  .put(
    "/:id",
    zValidator("param", idParamSchema),
    zValidator("json", updateUserSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      const updatedUser = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();

      if (updatedUser.length === 0) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({ user: updatedUser[0] });
    }
  )
  // DELETE /users/:id - 删除用户
  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (deletedUser.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ message: "User deleted", user: deletedUser[0] });
  });

// 导出类型
export type UsersRoutesType = typeof usersRoutes;
