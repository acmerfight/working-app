import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env["DATABASE_URL"] ??
  "postgresql://localhost:5432/working_app";

// 创建 postgres 客户端
const client = postgres(connectionString);

// 创建 drizzle 实例，导出 schema 以支持关系查询
export const db = drizzle(client, { schema });

// 导出 schema 类型
export type Database = typeof db;
export { schema };

