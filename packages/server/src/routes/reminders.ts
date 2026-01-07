import { zValidator } from "@hono/zod-validator";
import { and, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { reminders, reminderTypes } from "../db/schema";

// 创建提醒 schema
const createReminderSchema = z.object({
  eventId: z.number(),
  reminderTime: z.coerce.date(),
  type: z.enum(reminderTypes),
});

// 更新提醒 schema
const updateReminderSchema = z.object({
  reminderTime: z.coerce.date().optional(),
  type: z.enum(reminderTypes).optional(),
  isSent: z.boolean().optional(),
});

// 批量创建提醒 schema
const batchCreateRemindersSchema = z.object({
  eventId: z.number(),
  reminders: z.array(z.object({
    reminderTime: z.coerce.date(),
    type: z.enum(reminderTypes),
  })),
});

// 提醒路由
export const remindersRoutes = new Hono()
  // GET /reminders - 获取提醒列表
  .get("/", async (c) => {
    const eventId = c.req.query("eventId");
    const pending = c.req.query("pending"); // 只获取未发送的提醒
    const from = c.req.query("from"); // 起始时间
    const to = c.req.query("to"); // 结束时间

    const conditions = [];

    if (eventId) {
      conditions.push(eq(reminders.eventId, Number(eventId)));
    }

    if (pending === "true") {
      conditions.push(eq(reminders.isSent, false));
    }

    if (from) {
      conditions.push(gte(reminders.reminderTime, new Date(from)));
    }

    if (to) {
      conditions.push(lte(reminders.reminderTime, new Date(to)));
    }

    let allReminders;
    if (conditions.length > 0) {
      allReminders = await db
        .select()
        .from(reminders)
        .where(and(...conditions))
        .orderBy(reminders.reminderTime);
    } else {
      allReminders = await db
        .select()
        .from(reminders)
        .orderBy(reminders.reminderTime);
    }

    return c.json({ reminders: allReminders });
  })
  // GET /reminders/pending - 获取即将到期的提醒（用于通知）
  .get("/pending", async (c) => {
    const now = new Date();
    const futureMinutes = Number(c.req.query("minutes") ?? 5);
    const future = new Date(now.getTime() + futureMinutes * 60 * 1000);

    const pendingReminders = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.isSent, false),
          lte(reminders.reminderTime, future),
          gte(reminders.reminderTime, now)
        )
      )
      .orderBy(reminders.reminderTime);

    return c.json({ reminders: pendingReminders });
  })
  // GET /reminders/:id - 获取单个提醒
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的提醒 ID" }, 400);
    }

    const reminder = await db
      .select()
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);

    if (reminder.length === 0) {
      return c.json({ error: "提醒不存在" }, 404);
    }

    return c.json({ reminder: reminder[0] });
  })
  // POST /reminders - 创建提醒
  .post("/", zValidator("json", createReminderSchema), async (c) => {
    const data = c.req.valid("json");

    const newReminder = await db.insert(reminders).values(data).returning();

    return c.json({ reminder: newReminder[0] }, 201);
  })
  // POST /reminders/batch - 批量创建提醒
  .post("/batch", zValidator("json", batchCreateRemindersSchema), async (c) => {
    const { eventId, reminders: reminderList } = c.req.valid("json");

    const values = reminderList.map((r) => ({
      eventId,
      reminderTime: r.reminderTime,
      type: r.type,
    }));

    const newReminders = await db.insert(reminders).values(values).returning();

    return c.json({ reminders: newReminders }, 201);
  })
  // PUT /reminders/:id - 更新提醒
  .put("/:id", zValidator("json", updateReminderSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的提醒 ID" }, 400);
    }

    const updatedReminder = await db
      .update(reminders)
      .set(data)
      .where(eq(reminders.id, id))
      .returning();

    if (updatedReminder.length === 0) {
      return c.json({ error: "提醒不存在" }, 404);
    }

    return c.json({ reminder: updatedReminder[0] });
  })
  // PUT /reminders/:id/mark-sent - 标记提醒已发送
  .put("/:id/mark-sent", async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的提醒 ID" }, 400);
    }

    const updatedReminder = await db
      .update(reminders)
      .set({ isSent: true })
      .where(eq(reminders.id, id))
      .returning();

    if (updatedReminder.length === 0) {
      return c.json({ error: "提醒不存在" }, 404);
    }

    return c.json({ reminder: updatedReminder[0] });
  })
  // DELETE /reminders/:id - 删除提醒
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的提醒 ID" }, 400);
    }

    const deletedReminder = await db
      .delete(reminders)
      .where(eq(reminders.id, id))
      .returning();

    if (deletedReminder.length === 0) {
      return c.json({ error: "提醒不存在" }, 404);
    }

    return c.json({ message: "提醒已删除", reminder: deletedReminder[0] });
  })
  // DELETE /reminders/event/:eventId - 删除事件的所有提醒
  .delete("/event/:eventId", async (c) => {
    const eventId = Number(c.req.param("eventId"));

    if (Number.isNaN(eventId)) {
      return c.json({ error: "无效的事件 ID" }, 400);
    }

    const deletedReminders = await db
      .delete(reminders)
      .where(eq(reminders.eventId, eventId))
      .returning();

    return c.json({
      message: `已删除 ${deletedReminders.length} 个提醒`,
      reminders: deletedReminders,
    });
  });

export type RemindersRoutesType = typeof remindersRoutes;

