import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { calendars } from "./calendars";

// 日历事件表
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  calendarId: integer("calendar_id")
    .references(() => calendars.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  isAllDay: boolean("is_all_day").notNull().default(false),
  location: varchar("location", { length: 500 }),
  // 重复事件规则（RRULE 格式，如 "FREQ=WEEKLY;BYDAY=MO,WE,FR"）
  recurrenceRule: text("recurrence_rule"),
  recurrenceEndDate: timestamp("recurrence_end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Zod schemas
export const insertEventSchema = createInsertSchema(events, {
  title: z.string().min(1, "事件标题不能为空").max(200),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().max(500).optional(),
  recurrenceRule: z.string().optional(),
  recurrenceEndDate: z.coerce.date().optional(),
}).refine((data) => data.endTime >= data.startTime, {
  message: "结束时间必须晚于或等于开始时间",
  path: ["endTime"],
});

export const selectEventSchema = createSelectSchema(events);

// 类型导出
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

