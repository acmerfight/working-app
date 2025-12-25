/**
 * 认证路由
 * 处理用户注册、登录、登出和获取当前用户
 */
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractToken,
} from "../lib/auth";

// 注册请求 schema
const registerSchema = z.object({
  name: z.string().min(1, "姓名不能为空").max(100, "姓名不能超过100个字符"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6个字符").max(100, "密码不能超过100个字符"),
});

// 登录请求 schema
const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
});

// 用户响应类型（不包含密码）
type UserResponse = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 从用户数据中移除敏感信息
 */
function sanitizeUser(user: typeof users.$inferSelect): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const authRoutes = new Hono()
  /**
   * POST /auth/register - 用户注册
   */
  .post("/register", zValidator("json", registerSchema), async (c) => {
    try {
      const { name, email, password } = c.req.valid("json");

      // 检查邮箱是否已存在
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return c.json({ error: "该邮箱已被注册" }, 400);
      }

      // 加密密码
      const hashedPassword = await hashPassword(password);

      // 创建用户
      const newUser = await db
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
        })
        .returning();

      if (!newUser[0]) {
        return c.json({ error: "创建用户失败" }, 500);
      }

      // 生成 token
      const token = generateToken({
        userId: newUser[0].id,
        email: newUser[0].email,
      });

      return c.json(
        {
          message: "注册成功",
          user: sanitizeUser(newUser[0]),
          token,
        },
        201
      );
    } catch (error) {
      console.error("注册错误:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "注册失败" },
        500
      );
    }
  })

  /**
   * POST /auth/login - 用户登录
   */
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    // 查找用户
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0 || !user[0]) {
      return c.json({ error: "邮箱或密码错误" }, 401);
    }

    // 验证密码
    if (!user[0].password) {
      return c.json({ error: "该账户不支持密码登录" }, 401);
    }

    const isValidPassword = await verifyPassword(password, user[0].password);
    if (!isValidPassword) {
      return c.json({ error: "邮箱或密码错误" }, 401);
    }

    // 生成 token
    const token = generateToken({
      userId: user[0].id,
      email: user[0].email,
    });

    return c.json({
      message: "登录成功",
      user: sanitizeUser(user[0]),
      token,
    });
  })

  /**
   * GET /auth/me - 获取当前用户信息
   */
  .get("/me", async (c) => {
    const authHeader = c.req.header("Authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return c.json({ error: "未提供认证令牌" }, 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return c.json({ error: "无效或过期的令牌" }, 401);
    }

    // 获取用户信息
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user.length === 0 || !user[0]) {
      return c.json({ error: "用户不存在" }, 404);
    }

    return c.json({ user: sanitizeUser(user[0]) });
  })

  /**
   * POST /auth/logout - 用户登出
   * 注意：JWT 是无状态的，登出主要由客户端清除 token 完成
   * 这个端点主要用于记录日志或使 token 失效（需要额外的黑名单机制）
   */
  .post("/logout", async (c) => {
    // 验证 token（可选，用于日志记录）
    const authHeader = c.req.header("Authorization");
    const token = extractToken(authHeader);

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        // 可以在这里记录登出日志
        console.log(`用户 ${payload.email} 已登出`);
      }
    }

    return c.json({ message: "登出成功" });
  })

  /**
   * PUT /auth/password - 修改密码
   */
  .put(
    "/password",
    zValidator(
      "json",
      z.object({
        currentPassword: z.string().min(1, "当前密码不能为空"),
        newPassword: z.string().min(6, "新密码至少6个字符").max(100),
      })
    ),
    async (c) => {
      const authHeader = c.req.header("Authorization");
      const token = extractToken(authHeader);

      if (!token) {
        return c.json({ error: "未提供认证令牌" }, 401);
      }

      const payload = verifyToken(token);
      if (!payload) {
        return c.json({ error: "无效或过期的令牌" }, 401);
      }

      const { currentPassword, newPassword } = c.req.valid("json");

      // 获取用户
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (user.length === 0 || !user[0] || !user[0].password) {
        return c.json({ error: "用户不存在或不支持密码修改" }, 404);
      }

      // 验证当前密码
      const isValidPassword = await verifyPassword(
        currentPassword,
        user[0].password
      );
      if (!isValidPassword) {
        return c.json({ error: "当前密码错误" }, 401);
      }

      // 更新密码
      const hashedPassword = await hashPassword(newPassword);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, payload.userId));

      return c.json({ message: "密码修改成功" });
    }
  );

export type AuthRoutesType = typeof authRoutes;

