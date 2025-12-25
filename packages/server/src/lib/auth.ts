/**
 * 认证工具库
 * 处理密码加密、JWT 生成和验证
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// JWT 密钥（生产环境应该从环境变量读取）
const JWT_SECRET =
  process.env.JWT_SECRET ?? "your-super-secret-key-change-in-production";

// JWT 过期时间（7天）
const JWT_EXPIRES_IN = "7d";

// 密码加密盐轮数
const SALT_ROUNDS = 10;

// JWT Payload 类型
type JwtPayload = {
  userId: number;
  email: string;
};

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

/**
 * 从 Authorization header 提取 token
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
