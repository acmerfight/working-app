import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { calendars, insertCalendarSchema } from "../db/schema";

// 创建日历 schema
const createCalendarSchema = insertCalendarSchema.pick({
  name: true,
  color: true,
  userId: true,
  isDefault: true,
});

// 更新日历 schema
const updateCalendarSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isDefault: z.boolean().optional(),
});

// 日历路由
export const calendarsRoutes = new Hono()
  // GET /calendars - 获取所有日历
  .get("/", async (c) => {
    const userId = c.req.query("userId");
    
    let query = db.select().from(calendars);
    
    if (userId) {
      const allCalendars = await query.where(eq(calendars.userId, Number(userId)));
      return c.json({ calendars: allCalendars });
    }
    
    const allCalendars = await query;
    return c.json({ calendars: allCalendars });
  })
  // GET /calendars/:id - 获取单个日历
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的日历 ID" }, 400);
    }

    const calendar = await db
      .select()
      .from(calendars)
      .where(eq(calendars.id, id))
      .limit(1);

    if (calendar.length === 0) {
      return c.json({ error: "日历不存在" }, 404);
    }

    return c.json({ calendar: calendar[0] });
  })
  // POST /calendars - 创建日历
  .post("/", zValidator("json", createCalendarSchema), async (c) => {
    const data = c.req.valid("json");

    const newCalendar = await db.insert(calendars).values(data).returning();

    return c.json({ calendar: newCalendar[0] }, 201);
  })
  // PUT /calendars/:id - 更新日历
  .put("/:id", zValidator("json", updateCalendarSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的日历 ID" }, 400);
    }

    const updatedCalendar = await db
      .update(calendars)
      .set(data)
      .where(eq(calendars.id, id))
      .returning();

    if (updatedCalendar.length === 0) {
      return c.json({ error: "日历不存在" }, 404);
    }

    return c.json({ calendar: updatedCalendar[0] });
  })
  // DELETE /calendars/:id - 删除日历
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    if (Number.isNaN(id)) {
      return c.json({ error: "无效的日历 ID" }, 400);
    }

    const deletedCalendar = await db
      .delete(calendars)
      .where(eq(calendars.id, id))
      .returning();

    if (deletedCalendar.length === 0) {
      return c.json({ error: "日历不存在" }, 404);
    }

    return c.json({ message: "日历已删除", calendar: deletedCalendar[0] });
  });

export type CalendarsRoutesType = typeof calendarsRoutes;

