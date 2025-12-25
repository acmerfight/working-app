import { zValidator } from "@hono/zod-validator";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { events } from "../db/schema";

// 创建事件 schema
const createEventSchema = z.object({
  calendarId: z.number(),
  title: z.string().min(1, "事件标题不能为空").max(200),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isAllDay: z.boolean().optional().default(false),
  location: z.string().max(500).optional(),
  recurrenceRule: z.string().optional(),
  recurrenceEndDate: z.coerce.date().optional(),
}).refine((data) => data.endTime >= data.startTime, {
  message: "结束时间必须晚于或等于开始时间",
  path: ["endTime"],
});

// 更新事件 schema
const updateEventSchema = z.object({
  calendarId: z.number().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  isAllDay: z.boolean().optional(),
  location: z.string().max(500).optional(),
  recurrenceRule: z.string().nullable().optional(),
  recurrenceEndDate: z.coerce.date().nullable().optional(),
});

// 事件路由
export const eventsRoutes = new Hono()
  // GET /events - 获取事件列表（支持日期范围筛选）
  .get("/", async (c) => {
    const calendarId = c.req.query("calendarId");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    const conditions = [];

    // 按日历筛选
    if (calendarId) {
      conditions.push(eq(events.calendarId, Number(calendarId)));
    }

    // 按日期范围筛选
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // 获取在日期范围内的事件，或者是重复事件
      conditions.push(
        or(
          // 事件在范围内
          and(
            lte(events.startTime, end),
            gte(events.endTime, start)
          ),
          // 或者是有效的重复事件
          and(
            lte(events.startTime, end),
            or(
              // 没有结束日期的重复事件
              and(
                eq(events.recurrenceRule, events.recurrenceRule), // 有重复规则
                eq(events.recurrenceEndDate, null as unknown as Date)
              ),
              // 结束日期在范围内的重复事件
              gte(events.recurrenceEndDate, start)
            )
          )
        )
      );
    } else if (startDate) {
      conditions.push(gte(events.startTime, new Date(startDate)));
    } else if (endDate) {
      conditions.push(lte(events.endTime, new Date(endDate)));
    }

    let allEvents;
    if (conditions.length > 0) {
      allEvents = await db
        .select()
        .from(events)
        .where(and(...conditions))
        .orderBy(events.startTime);
    } else {
      allEvents = await db.select().from(events).orderBy(events.startTime);
    }

    return c.json({ events: allEvents });
  })
  // GET /events/:id - 获取单个事件
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的事件 ID" }, 400);
    }

    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (event.length === 0) {
      return c.json({ error: "事件不存在" }, 404);
    }

    return c.json({ event: event[0] });
  })
  // POST /events - 创建事件
  .post("/", zValidator("json", createEventSchema), async (c) => {
    const data = c.req.valid("json");

    const newEvent = await db.insert(events).values(data).returning();

    return c.json({ event: newEvent[0] }, 201);
  })
  // PUT /events/:id - 更新事件
  .put("/:id", zValidator("json", updateEventSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的事件 ID" }, 400);
    }

    // 如果同时更新了开始和结束时间，验证结束时间
    if (data.startTime && data.endTime && data.endTime < data.startTime) {
      return c.json({ error: "结束时间必须晚于或等于开始时间" }, 400);
    }

    const updatedEvent = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();

    if (updatedEvent.length === 0) {
      return c.json({ error: "事件不存在" }, 404);
    }

    return c.json({ event: updatedEvent[0] });
  })
  // DELETE /events/:id - 删除事件
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的事件 ID" }, 400);
    }

    const deletedEvent = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();

    if (deletedEvent.length === 0) {
      return c.json({ error: "事件不存在" }, 404);
    }

    return c.json({ message: "事件已删除", event: deletedEvent[0] });
  });

export type EventsRoutesType = typeof eventsRoutes;

