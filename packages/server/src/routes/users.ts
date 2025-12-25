import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { insertUserSchema, users } from "../db/schema";

export const usersRoutes = new Hono();

// GET /users - 获取所有用户
usersRoutes.get("/", async (c) => {
  const allUsers = await db.select().from(users);
  return c.json({ users: allUsers });
});

// GET /users/:id - 获取单个用户
usersRoutes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json({ error: "Invalid user ID" }, 400);
  }

  const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

  if (user.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user: user[0] });
});

// POST /users - 创建用户
const createUserSchema = insertUserSchema.pick({
  name: true,
  email: true,
});

usersRoutes.post("/", zValidator("json", createUserSchema), async (c) => {
  const data = c.req.valid("json");

  const newUser = await db
    .insert(users)
    .values(data)
    .returning();

  return c.json({ user: newUser[0] }, 201);
});

// PUT /users/:id - 更新用户
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

usersRoutes.put("/:id", zValidator("json", updateUserSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const data = c.req.valid("json");

  if (Number.isNaN(id)) {
    return c.json({ error: "Invalid user ID" }, 400);
  }

  const updatedUser = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();

  if (updatedUser.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user: updatedUser[0] });
});

// DELETE /users/:id - 删除用户
usersRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json({ error: "Invalid user ID" }, 400);
  }

  const deletedUser = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  if (deletedUser.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ message: "User deleted", user: deletedUser[0] });
});

