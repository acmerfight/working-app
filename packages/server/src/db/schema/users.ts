import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// 用户表定义
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Zod schemas (从 Drizzle schema 自动生成)
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(100),
});

export const selectUserSchema = createSelectSchema(users);

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

