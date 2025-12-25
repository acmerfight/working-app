import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

// 日历分类表（工作、个人、家庭等）
export const calendars = pgTable("calendars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // #RRGGBB 格式
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Zod schemas
export const insertCalendarSchema = createInsertSchema(calendars, {
  name: z.string().min(1, "日历名称不能为空").max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "颜色格式必须为 #RRGGBB"),
});

export const selectCalendarSchema = createSelectSchema(calendars);

// 类型导出
export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;

