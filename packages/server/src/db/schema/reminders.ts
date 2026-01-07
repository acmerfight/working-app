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
import { events } from "./events";

// 提醒类型枚举
export const reminderTypes = ["notification", "email"] as const;
export type ReminderType = (typeof reminderTypes)[number];

// 事件提醒表
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  reminderTime: timestamp("reminder_time", { withTimezone: true }).notNull(),
  type: varchar("type", { length: 20 }).notNull().$type<ReminderType>(),
  isSent: boolean("is_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Zod schemas
export const insertReminderSchema = createInsertSchema(reminders, {
  reminderTime: z.coerce.date(),
  type: z.enum(reminderTypes),
});

export const selectReminderSchema = createSelectSchema(reminders);

// 类型导出
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

