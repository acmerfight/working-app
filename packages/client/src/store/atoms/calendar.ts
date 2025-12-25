import { atom } from "jotai";
import { apiClient } from "../../lib/api-client";

// ============ 类型定义 ============

export type Calendar = {
  id: number;
  userId: number | null;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEvent = {
  id: number;
  calendarId: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location: string | null;
  recurrenceRule: string | null;
  recurrenceEndDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Reminder = {
  id: number;
  eventId: number;
  reminderTime: string;
  type: "notification" | "email";
  isSent: boolean;
  createdAt: string;
};

export type ViewMode = "month" | "week" | "day";

export type NewEventData = {
  calendarId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  location?: string;
  recurrenceRule?: string;
  recurrenceEndDate?: Date;
};

export type UpdateEventData = Partial<NewEventData> & { id: number };

// ============ State Atoms ============

// 日历列表
export const calendarsAtom = atom<Calendar[]>([]);

// 事件列表
export const eventsAtom = atom<CalendarEvent[]>([]);

// 提醒列表
export const remindersAtom = atom<Reminder[]>([]);

// 当前选中的日期
export const selectedDateAtom = atom<Date>(new Date());

// 视图模式（月/周/日）
export const viewModeAtom = atom<ViewMode>("month");

// 选中的日历 ID（用于筛选显示）
export const selectedCalendarIdsAtom = atom<number[]>([]);

// 当前正在编辑的事件
export const editingEventAtom = atom<CalendarEvent | null>(null);

// 是否显示事件弹窗
export const showEventModalAtom = atom(false);

// 新建事件的初始数据（点击日历格子时的日期时间）
export const newEventInitialDataAtom = atom<{ startTime: Date; endTime: Date } | null>(null);

// Loading 状态
export const calendarLoadingAtom = atom(false);

// 错误状态
export const calendarErrorAtom = atom<string | null>(null);

// ============ Derived Atoms ============

// 根据选中的日历筛选事件
export const visibleEventsAtom = atom((get) => {
  const events = get(eventsAtom);
  const selectedIds = get(selectedCalendarIdsAtom);
  
  // 如果没有选中任何日历，显示所有事件
  if (selectedIds.length === 0) {
    return events;
  }
  
  return events.filter((e) => selectedIds.includes(e.calendarId));
});

// 获取指定日期的事件
export const getEventsForDateAtom = atom((get) => {
  const events = get(visibleEventsAtom);
  
  return (date: Date) => {
    const dateStr = date.toISOString().split("T")[0] ?? "";
    return events.filter((event) => {
      const eventStart = new Date(event.startTime).toISOString().split("T")[0] ?? "";
      const eventEnd = new Date(event.endTime).toISOString().split("T")[0] ?? "";
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };
});

// 获取当前月份的所有日期
export const currentMonthDaysAtom = atom((get) => {
  const selectedDate = get(selectedDateAtom);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  // 获取当月第一天
  const firstDay = new Date(year, month, 1);
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0);
  
  // 获取第一天是星期几（0-6，0 是周日）
  const startDayOfWeek = firstDay.getDay();
  
  const days: Date[] = [];
  
  // 添加上个月的日期填充
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // 添加当月日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // 添加下个月的日期填充（确保总是 6 行 = 42 天）
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
});

// 获取当前周的日期
export const currentWeekDaysAtom = atom((get) => {
  const selectedDate = get(selectedDateAtom);
  const dayOfWeek = selectedDate.getDay();
  
  // 获取周日（一周的开始）
  const sunday = new Date(selectedDate);
  sunday.setDate(selectedDate.getDate() - dayOfWeek);
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    days.push(day);
  }
  
  return days;
});

// 获取日历的颜色映射
export const calendarColorsAtom = atom((get) => {
  const calendars = get(calendarsAtom);
  const colorMap: Record<number, string> = {};
  calendars.forEach((cal) => {
    colorMap[cal.id] = cal.color;
  });
  return colorMap;
});

// ============ Action Atoms ============

// 获取所有日历
export const fetchCalendarsAtom = atom(null, async (_get, set) => {
  set(calendarLoadingAtom, true);
  set(calendarErrorAtom, null);
  try {
    const response = await apiClient.calendars.$get();
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    const data = await response.json();
    set(calendarsAtom, data.calendars as Calendar[]);
    // 默认选中所有日历
    set(selectedCalendarIdsAtom, (data.calendars as Calendar[]).map((c) => c.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取日历失败";
    set(calendarErrorAtom, message);
  } finally {
    set(calendarLoadingAtom, false);
  }
});

// 创建日历
export const createCalendarAtom = atom(
  null,
  async (get, set, data: { name: string; color: string; userId?: number }) => {
    set(calendarLoadingAtom, true);
    set(calendarErrorAtom, null);
    try {
      const response = await apiClient.calendars.$post({
        json: {
          name: data.name,
          color: data.color,
          userId: data.userId,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      const result = await response.json();
      const calendars = get(calendarsAtom);
      set(calendarsAtom, [...calendars, result.calendar as Calendar]);
      // 自动选中新创建的日历
      const selectedIds = get(selectedCalendarIdsAtom);
      set(selectedCalendarIdsAtom, [...selectedIds, (result.calendar as Calendar).id]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "创建日历失败";
      set(calendarErrorAtom, message);
    } finally {
      set(calendarLoadingAtom, false);
    }
  }
);

// 删除日历
export const deleteCalendarAtom = atom(null, async (get, set, id: number) => {
  set(calendarLoadingAtom, true);
  set(calendarErrorAtom, null);
  try {
    const response = await apiClient.calendars[":id"].$delete({
      param: { id: String(id) },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    const calendars = get(calendarsAtom);
    set(
      calendarsAtom,
      calendars.filter((c) => c.id !== id)
    );
    // 从选中列表移除
    const selectedIds = get(selectedCalendarIdsAtom);
    set(
      selectedCalendarIdsAtom,
      selectedIds.filter((cid) => cid !== id)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除日历失败";
    set(calendarErrorAtom, message);
  } finally {
    set(calendarLoadingAtom, false);
  }
});

// 获取事件（按日期范围）
export const fetchEventsAtom = atom(
  null,
  async (_get, set, params?: { startDate?: Date; endDate?: Date; calendarId?: number }) => {
    set(calendarLoadingAtom, true);
    set(calendarErrorAtom, null);
    try {
      const query: Record<string, string> = {};
      if (params?.startDate) {
        query.startDate = params.startDate.toISOString();
      }
      if (params?.endDate) {
        query.endDate = params.endDate.toISOString();
      }
      if (params?.calendarId) {
        query.calendarId = String(params.calendarId);
      }

      const response = await apiClient.events.$get({ query });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      const data = await response.json();
      set(eventsAtom, data.events as CalendarEvent[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取事件失败";
      set(calendarErrorAtom, message);
    } finally {
      set(calendarLoadingAtom, false);
    }
  }
);

// 创建事件
export const createEventAtom = atom(null, async (get, set, data: NewEventData) => {
  set(calendarLoadingAtom, true);
  set(calendarErrorAtom, null);
  try {
    const response = await apiClient.events.$post({
      json: {
        calendarId: data.calendarId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: data.isAllDay ?? false,
        location: data.location,
        recurrenceRule: data.recurrenceRule,
        recurrenceEndDate: data.recurrenceEndDate,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    const result = await response.json();
    const events = get(eventsAtom);
    set(eventsAtom, [...events, result.event as CalendarEvent]);
    set(showEventModalAtom, false);
    set(newEventInitialDataAtom, null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建事件失败";
    set(calendarErrorAtom, message);
  } finally {
    set(calendarLoadingAtom, false);
  }
});

// 更新事件
export const updateEventAtom = atom(null, async (get, set, data: UpdateEventData) => {
  set(calendarLoadingAtom, true);
  set(calendarErrorAtom, null);
  try {
    const updateData: Record<string, unknown> = {};
    if (data.calendarId !== undefined) updateData.calendarId = data.calendarId;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.recurrenceRule !== undefined) updateData.recurrenceRule = data.recurrenceRule;
    if (data.recurrenceEndDate !== undefined) {
      updateData.recurrenceEndDate = data.recurrenceEndDate;
    }

    const response = await apiClient.events[":id"].$put({
      param: { id: String(data.id) },
      json: updateData as Parameters<typeof apiClient.events[":id"]["$put"]>[0]["json"],
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    const result = await response.json();
    const events = get(eventsAtom);
    set(
      eventsAtom,
      events.map((e) => (e.id === data.id ? (result.event as CalendarEvent) : e))
    );
    set(editingEventAtom, null);
    set(showEventModalAtom, false);
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新事件失败";
    set(calendarErrorAtom, message);
  } finally {
    set(calendarLoadingAtom, false);
  }
});

// 删除事件
export const deleteEventAtom = atom(null, async (get, set, id: number) => {
  set(calendarLoadingAtom, true);
  set(calendarErrorAtom, null);
  try {
    const response = await apiClient.events[":id"].$delete({
      param: { id: String(id) },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    const events = get(eventsAtom);
    set(
      eventsAtom,
      events.filter((e) => e.id !== id)
    );
    set(editingEventAtom, null);
    set(showEventModalAtom, false);
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除事件失败";
    set(calendarErrorAtom, message);
  } finally {
    set(calendarLoadingAtom, false);
  }
});

// 导航操作
export const goToPrevPeriodAtom = atom(null, (get, set) => {
  const currentDate = get(selectedDateAtom);
  const viewMode = get(viewModeAtom);
  const newDate = new Date(currentDate);

  switch (viewMode) {
    case "month":
      newDate.setMonth(newDate.getMonth() - 1);
      break;
    case "week":
      newDate.setDate(newDate.getDate() - 7);
      break;
    case "day":
      newDate.setDate(newDate.getDate() - 1);
      break;
  }

  set(selectedDateAtom, newDate);
});

export const goToNextPeriodAtom = atom(null, (get, set) => {
  const currentDate = get(selectedDateAtom);
  const viewMode = get(viewModeAtom);
  const newDate = new Date(currentDate);

  switch (viewMode) {
    case "month":
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case "week":
      newDate.setDate(newDate.getDate() + 7);
      break;
    case "day":
      newDate.setDate(newDate.getDate() + 1);
      break;
  }

  set(selectedDateAtom, newDate);
});

export const goToTodayAtom = atom(null, (_get, set) => {
  set(selectedDateAtom, new Date());
});

// 切换日历选中状态
export const toggleCalendarSelectionAtom = atom(null, (get, set, calendarId: number) => {
  const selectedIds = get(selectedCalendarIdsAtom);
  if (selectedIds.includes(calendarId)) {
    set(
      selectedCalendarIdsAtom,
      selectedIds.filter((id) => id !== calendarId)
    );
  } else {
    set(selectedCalendarIdsAtom, [...selectedIds, calendarId]);
  }
});

// 打开新建事件弹窗
export const openNewEventModalAtom = atom(null, (_get, set, initialData?: { startTime: Date; endTime: Date }) => {
  set(editingEventAtom, null);
  set(newEventInitialDataAtom, initialData ?? null);
  set(showEventModalAtom, true);
});

// 打开编辑事件弹窗
export const openEditEventModalAtom = atom(null, (_get, set, event: CalendarEvent) => {
  set(editingEventAtom, event);
  set(newEventInitialDataAtom, null);
  set(showEventModalAtom, true);
});

// 关闭事件弹窗
export const closeEventModalAtom = atom(null, (_get, set) => {
  set(editingEventAtom, null);
  set(newEventInitialDataAtom, null);
  set(showEventModalAtom, false);
});

// 拖拽更新事件时间
export const dragUpdateEventAtom = atom(
  null,
  async (get, set, params: { eventId: number; newStartTime: Date; newEndTime: Date }) => {
    const { eventId, newStartTime, newEndTime } = params;
    
    // 乐观更新
    const events = get(eventsAtom);
    const eventIndex = events.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) return;

    const originalEvent = events[eventIndex];
    if (!originalEvent) return;
    
    const optimisticEvent: CalendarEvent = {
      ...originalEvent,
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString(),
    };

    // 立即更新 UI
    set(eventsAtom, [
      ...events.slice(0, eventIndex),
      optimisticEvent,
      ...events.slice(eventIndex + 1),
    ]);

    try {
      const response = await apiClient.events[":id"].$put({
        param: { id: String(eventId) },
        json: {
          startTime: newStartTime,
          endTime: newEndTime,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      
      const result = await response.json();
      // 用服务器响应更新
      set(
        eventsAtom,
        get(eventsAtom).map((e) => (e.id === eventId ? (result.event as CalendarEvent) : e))
      );
    } catch (error) {
      // 回滚到原始状态
      set(eventsAtom, events);
      const message = error instanceof Error ? error.message : "更新事件失败";
      set(calendarErrorAtom, message);
    }
  }
);

