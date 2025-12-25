/**
 * 日历功能 BDD 集成测试
 *
 * Feature: 日历管理
 *   As a 用户
 *   I want 管理我的日历
 *   So that 我可以分类组织我的事件
 *
 * Feature: 事件管理
 *   As a 用户
 *   I want 创建、编辑和删除事件
 *   So that 我可以安排我的日程
 *
 * 测试策略：Atoms + Hono app（不启动服务器）
 */
import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 直接导入 Hono app
import { app } from "@working-app/server/app";

// 导入要测试的 atoms
import {
  // State atoms
  calendarsAtom,
  eventsAtom,
  selectedDateAtom,
  viewModeAtom,
  selectedCalendarIdsAtom,
  editingEventAtom,
  showEventModalAtom,
  newEventInitialDataAtom,
  calendarLoadingAtom,
  calendarErrorAtom,
  // Derived atoms
  visibleEventsAtom,
  getEventsForDateAtom,
  currentMonthDaysAtom,
  currentWeekDaysAtom,
  calendarColorsAtom,
  // Action atoms
  fetchCalendarsAtom,
  createCalendarAtom,
  deleteCalendarAtom,
  fetchEventsAtom,
  createEventAtom,
  updateEventAtom,
  deleteEventAtom,
  goToPrevPeriodAtom,
  goToNextPeriodAtom,
  goToTodayAtom,
  toggleCalendarSelectionAtom,
  openNewEventModalAtom,
  openEditEventModalAtom,
  closeEventModalAtom,
  dragUpdateEventAtom,
  type Calendar,
  type CalendarEvent,
} from "../atoms/calendar";

// ============================================================
// 测试辅助函数
// ============================================================

/**
 * 配置 fetch 使用 Hono app 处理请求
 */
function setupHonoFetch() {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const fullUrl = url.startsWith("http") ? url : `http://localhost${url}`;
    return app.request(fullUrl, init);
  });
}

/**
 * 订阅 atom 变化，返回历史记录
 */
function trackAtomChanges<T>(
  store: ReturnType<typeof createStore>,
  atom: typeof calendarLoadingAtom
) {
  const history: T[] = [];
  store.sub(atom, () => {
    history.push(store.get(atom) as T);
  });
  return history;
}

/**
 * 创建测试用的日历数据
 */
function createTestCalendar(overrides?: Partial<Calendar>): Calendar {
  return {
    id: 1,
    userId: null,
    name: "测试日历",
    color: "#3b82f6",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 创建测试用的事件数据
 */
function createTestEvent(overrides?: Partial<CalendarEvent>): CalendarEvent {
  const now = new Date();
  const startTime = new Date(now);
  startTime.setHours(10, 0, 0, 0);
  const endTime = new Date(now);
  endTime.setHours(11, 0, 0, 0);

  return {
    id: 1,
    calendarId: 1,
    title: "测试事件",
    description: null,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    isAllDay: false,
    location: null,
    recurrenceRule: null,
    recurrenceEndDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// Feature: 日历管理
// ============================================================

describe("Feature: 日历管理", () => {
  beforeEach(() => {
    setupHonoFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 获取日历列表", () => {
    it("Given 服务器有日历数据, When 调用 fetchCalendars, Then 应该返回日历列表并自动选中", async () => {
      // Given
      const store = createStore();
      expect(store.get(calendarsAtom)).toEqual([]);
      expect(store.get(selectedCalendarIdsAtom)).toEqual([]);

      // When
      await store.set(fetchCalendarsAtom);

      // Then
      const calendars = store.get(calendarsAtom);
      const selectedIds = store.get(selectedCalendarIdsAtom);
      // 日历列表已加载（可能为空或有数据）
      expect(Array.isArray(calendars)).toBe(true);
      // 选中的日历 ID 应该与日历列表匹配
      expect(selectedIds).toEqual(calendars.map((c) => c.id));
    });

    it("Given 调用 fetchCalendars, Then Loading 状态应该经历 false → true → false", async () => {
      // Given
      const store = createStore();
      const loadingHistory = trackAtomChanges<boolean>(store, calendarLoadingAtom);

      // When
      await store.set(fetchCalendarsAtom);

      // Then
      expect(loadingHistory).toEqual([true, false]);
      expect(store.get(calendarLoadingAtom)).toBe(false);
    });
  });

  describe("Scenario: 创建新日历", () => {
    it("Given 用户填写日历信息, When 创建日历, Then 新日历应该添加到列表并自动选中", async () => {
      // Given
      const store = createStore();
      const initialCalendars = store.get(calendarsAtom);
      const initialCount = initialCalendars.length;

      // When
      await store.set(createCalendarAtom, {
        name: "工作日历",
        color: "#ef4444",
      });

      // Then
      const calendars = store.get(calendarsAtom);
      expect(calendars.length).toBe(initialCount + 1);
      
      const newCalendar = calendars[calendars.length - 1];
      expect(newCalendar?.name).toBe("工作日历");
      expect(newCalendar?.color).toBe("#ef4444");
      
      // 新日历应该自动选中
      const selectedIds = store.get(selectedCalendarIdsAtom);
      expect(selectedIds).toContain(newCalendar?.id);
    });

    it("Given 创建日历, Then Loading 状态应该正确变化", async () => {
      // Given
      const store = createStore();
      const loadingHistory = trackAtomChanges<boolean>(store, calendarLoadingAtom);

      // When
      await store.set(createCalendarAtom, {
        name: "测试日历",
        color: "#3b82f6",
      });

      // Then
      expect(loadingHistory).toEqual([true, false]);
      expect(store.get(calendarErrorAtom)).toBeNull();
    });
  });

  describe("Scenario: 删除日历", () => {
    it("Given 存在一个日历, When 删除该日历, Then 应该从列表中移除", async () => {
      // Given
      const store = createStore();
      // 先创建一个日历
      await store.set(createCalendarAtom, {
        name: "待删除日历",
        color: "#22c55e",
      });
      const calendars = store.get(calendarsAtom);
      const calendarToDelete = calendars[calendars.length - 1];
      expect(calendarToDelete).toBeDefined();

      // When
      await store.set(deleteCalendarAtom, calendarToDelete!.id);

      // Then
      const updatedCalendars = store.get(calendarsAtom);
      expect(updatedCalendars.find((c) => c.id === calendarToDelete!.id)).toBeUndefined();
      
      // 选中列表也应该更新
      const selectedIds = store.get(selectedCalendarIdsAtom);
      expect(selectedIds).not.toContain(calendarToDelete!.id);
    });
  });

  describe("Scenario: 切换日历显示", () => {
    it("Given 日历已选中, When 取消选中, Then 应该从选中列表移除", () => {
      // Given
      const store = createStore();
      store.set(selectedCalendarIdsAtom, [1, 2, 3]);
      expect(store.get(selectedCalendarIdsAtom)).toContain(2);

      // When
      store.set(toggleCalendarSelectionAtom, 2);

      // Then
      expect(store.get(selectedCalendarIdsAtom)).toEqual([1, 3]);
    });

    it("Given 日历未选中, When 选中日历, Then 应该添加到选中列表", () => {
      // Given
      const store = createStore();
      store.set(selectedCalendarIdsAtom, [1, 3]);
      expect(store.get(selectedCalendarIdsAtom)).not.toContain(2);

      // When
      store.set(toggleCalendarSelectionAtom, 2);

      // Then
      expect(store.get(selectedCalendarIdsAtom)).toContain(2);
    });
  });
});

// ============================================================
// Feature: 事件管理
// ============================================================

describe("Feature: 事件管理", () => {
  beforeEach(() => {
    setupHonoFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 获取事件列表", () => {
    it("Given 服务器有事件数据, When 调用 fetchEvents, Then 应该返回事件列表", async () => {
      // Given
      const store = createStore();
      expect(store.get(eventsAtom)).toEqual([]);

      // When
      await store.set(fetchEventsAtom);

      // Then
      const events = store.get(eventsAtom);
      expect(Array.isArray(events)).toBe(true);
      expect(store.get(calendarErrorAtom)).toBeNull();
    });

    it("Given 调用 fetchEvents 带日期范围, Then 应该只返回范围内的事件", async () => {
      // Given
      const store = createStore();
      const startDate = new Date("2025-12-01");
      const endDate = new Date("2025-12-31");

      // When
      await store.set(fetchEventsAtom, { startDate, endDate });

      // Then
      expect(store.get(calendarLoadingAtom)).toBe(false);
      expect(store.get(calendarErrorAtom)).toBeNull();
    });
  });

  describe("Scenario: 创建新事件", () => {
    it("Given 用户填写事件信息, When 创建事件, Then 新事件应该添加到列表并关闭弹窗", async () => {
      // Given
      const store = createStore();
      // 先创建一个日历
      await store.set(createCalendarAtom, { name: "测试日历", color: "#3b82f6" });
      const calendars = store.get(calendarsAtom);
      const calendarId = calendars[calendars.length - 1]?.id ?? 1;
      
      store.set(showEventModalAtom, true);
      const initialEvents = store.get(eventsAtom);

      const startTime = new Date();
      startTime.setHours(14, 0, 0, 0);
      const endTime = new Date();
      endTime.setHours(15, 0, 0, 0);

      // When
      await store.set(createEventAtom, {
        calendarId,
        title: "会议",
        description: "团队周会",
        startTime,
        endTime,
        isAllDay: false,
      });

      // Then
      const events = store.get(eventsAtom);
      expect(events.length).toBe(initialEvents.length + 1);
      
      const newEvent = events[events.length - 1];
      expect(newEvent?.title).toBe("会议");
      expect(newEvent?.description).toBe("团队周会");
      
      // 弹窗应该关闭
      expect(store.get(showEventModalAtom)).toBe(false);
      expect(store.get(newEventInitialDataAtom)).toBeNull();
    });
  });

  describe("Scenario: 更新事件", () => {
    it("Given 存在一个事件, When 更新事件标题, Then 事件应该被更新", async () => {
      // Given
      const store = createStore();
      // 先创建日历和事件
      await store.set(createCalendarAtom, { name: "测试日历", color: "#3b82f6" });
      const calendars = store.get(calendarsAtom);
      const calendarId = calendars[calendars.length - 1]?.id ?? 1;

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      await store.set(createEventAtom, {
        calendarId,
        title: "原标题",
        startTime,
        endTime,
      });

      const events = store.get(eventsAtom);
      const eventToUpdate = events[events.length - 1];

      // When
      await store.set(updateEventAtom, {
        id: eventToUpdate!.id,
        title: "新标题",
      });

      // Then
      const updatedEvents = store.get(eventsAtom);
      const updatedEvent = updatedEvents.find((e) => e.id === eventToUpdate!.id);
      expect(updatedEvent?.title).toBe("新标题");
    });
  });

  describe("Scenario: 删除事件", () => {
    it("Given 存在一个事件, When 删除事件, Then 应该从列表中移除", async () => {
      // Given
      const store = createStore();
      // 先创建日历和事件
      await store.set(createCalendarAtom, { name: "测试日历", color: "#3b82f6" });
      const calendars = store.get(calendarsAtom);
      const calendarId = calendars[calendars.length - 1]?.id ?? 1;

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      await store.set(createEventAtom, {
        calendarId,
        title: "待删除事件",
        startTime,
        endTime,
      });

      const events = store.get(eventsAtom);
      const eventToDelete = events[events.length - 1];
      expect(eventToDelete).toBeDefined();

      // When
      await store.set(deleteEventAtom, eventToDelete!.id);

      // Then
      const updatedEvents = store.get(eventsAtom);
      expect(updatedEvents.find((e) => e.id === eventToDelete!.id)).toBeUndefined();
    });
  });

  describe("Scenario: 拖拽更新事件时间", () => {
    it("Given 存在一个事件, When 拖拽到新日期, Then 应该立即更新（乐观更新）", async () => {
      // Given
      const store = createStore();
      // 创建测试事件
      await store.set(createCalendarAtom, { name: "测试日历", color: "#3b82f6" });
      const calendars = store.get(calendarsAtom);
      const calendarId = calendars[calendars.length - 1]?.id ?? 1;

      const originalStart = new Date("2025-12-25T10:00:00");
      const originalEnd = new Date("2025-12-25T11:00:00");
      await store.set(createEventAtom, {
        calendarId,
        title: "拖拽测试事件",
        startTime: originalStart,
        endTime: originalEnd,
      });

      const events = store.get(eventsAtom);
      const event = events[events.length - 1];

      const newStartTime = new Date("2025-12-26T10:00:00");
      const newEndTime = new Date("2025-12-26T11:00:00");

      // When
      await store.set(dragUpdateEventAtom, {
        eventId: event!.id,
        newStartTime,
        newEndTime,
      });

      // Then - 验证乐观更新
      const updatedEvents = store.get(eventsAtom);
      const updatedEvent = updatedEvents.find((e) => e.id === event!.id);
      expect(new Date(updatedEvent!.startTime).toDateString()).toBe(newStartTime.toDateString());
    });
  });
});

// ============================================================
// Feature: 事件筛选（派生 Atoms）
// ============================================================

describe("Feature: 事件筛选", () => {
  describe("Scenario: 根据日历筛选事件", () => {
    it("Given 有多个日历的事件, When 选中部分日历, Then 只显示选中日历的事件", () => {
      // Given
      const store = createStore();
      store.set(eventsAtom, [
        createTestEvent({ id: 1, calendarId: 1, title: "日历1事件" }),
        createTestEvent({ id: 2, calendarId: 2, title: "日历2事件" }),
        createTestEvent({ id: 3, calendarId: 3, title: "日历3事件" }),
      ]);
      store.set(selectedCalendarIdsAtom, [1, 3]);

      // When
      const visibleEvents = store.get(visibleEventsAtom);

      // Then
      expect(visibleEvents.length).toBe(2);
      expect(visibleEvents.map((e) => e.calendarId)).toEqual([1, 3]);
    });

    it("Given 没有选中任何日历, Then 显示所有事件", () => {
      // Given
      const store = createStore();
      store.set(eventsAtom, [
        createTestEvent({ id: 1, calendarId: 1 }),
        createTestEvent({ id: 2, calendarId: 2 }),
      ]);
      store.set(selectedCalendarIdsAtom, []);

      // When
      const visibleEvents = store.get(visibleEventsAtom);

      // Then
      expect(visibleEvents.length).toBe(2);
    });
  });

  describe("Scenario: 获取指定日期的事件", () => {
    it("Given 有跨天事件, When 查询某一天, Then 应该返回包含该天的事件", () => {
      // Given
      const store = createStore();
      store.set(eventsAtom, [
        createTestEvent({
          id: 1,
          title: "跨天事件",
          startTime: "2025-12-24T18:00:00.000Z",
          endTime: "2025-12-26T08:00:00.000Z",
        }),
        createTestEvent({
          id: 2,
          title: "单日事件",
          startTime: "2025-12-25T10:00:00.000Z",
          endTime: "2025-12-25T11:00:00.000Z",
        }),
      ]);

      // When
      const getEventsForDate = store.get(getEventsForDateAtom);
      const eventsOnChristmas = getEventsForDate(new Date("2025-12-25"));

      // Then
      expect(eventsOnChristmas.length).toBe(2);
    });
  });
});

// ============================================================
// Feature: 视图导航
// ============================================================

describe("Feature: 视图导航", () => {
  describe("Scenario: 月视图导航", () => {
    it("Given 当前是2025年12月, When 点击上一个月, Then 应该显示2025年11月", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-15"));
      store.set(viewModeAtom, "month");

      // When
      store.set(goToPrevPeriodAtom);

      // Then
      const selectedDate = store.get(selectedDateAtom);
      expect(selectedDate.getMonth()).toBe(10); // 11月 (0-indexed)
      expect(selectedDate.getFullYear()).toBe(2025);
    });

    it("Given 当前是2025年12月, When 点击下一个月, Then 应该显示2026年1月", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-15"));
      store.set(viewModeAtom, "month");

      // When
      store.set(goToNextPeriodAtom);

      // Then
      const selectedDate = store.get(selectedDateAtom);
      expect(selectedDate.getMonth()).toBe(0); // 1月
      expect(selectedDate.getFullYear()).toBe(2026);
    });
  });

  describe("Scenario: 周视图导航", () => {
    it("Given 当前是某一周, When 点击上一周, Then 应该显示上一周", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));
      store.set(viewModeAtom, "week");
      const originalDate = store.get(selectedDateAtom).getDate();

      // When
      store.set(goToPrevPeriodAtom);

      // Then
      const selectedDate = store.get(selectedDateAtom);
      expect(selectedDate.getDate()).toBe(originalDate - 7);
    });
  });

  describe("Scenario: 日视图导航", () => {
    it("Given 当前是12月25日, When 点击上一天, Then 应该显示12月24日", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));
      store.set(viewModeAtom, "day");

      // When
      store.set(goToPrevPeriodAtom);

      // Then
      const selectedDate = store.get(selectedDateAtom);
      expect(selectedDate.getDate()).toBe(24);
    });

    it("Given 当前是12月25日, When 点击下一天, Then 应该显示12月26日", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));
      store.set(viewModeAtom, "day");

      // When
      store.set(goToNextPeriodAtom);

      // Then
      const selectedDate = store.get(selectedDateAtom);
      expect(selectedDate.getDate()).toBe(26);
    });
  });

  describe("Scenario: 返回今天", () => {
    it("Given 当前查看其他日期, When 点击今天按钮, Then 应该返回今天", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2024-01-01"));
      const today = new Date();

      // When
      store.set(goToTodayAtom);

      // Then
      const selectedDate = store.get(selectedDateAtom);
      expect(selectedDate.toDateString()).toBe(today.toDateString());
    });
  });

  describe("Scenario: 当月日期网格", () => {
    it("Given 选中2025年12月, Then 应该返回包含前后填充的42天", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-15"));

      // When
      const days = store.get(currentMonthDaysAtom);

      // Then
      expect(days.length).toBe(42);
      // 第一天应该是某个周日
      expect(days[0]?.getDay()).toBe(0);
    });
  });

  describe("Scenario: 当前周日期", () => {
    it("Given 选中某一天, Then 应该返回该周的7天（周日到周六）", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25")); // 周四

      // When
      const days = store.get(currentWeekDaysAtom);

      // Then
      expect(days.length).toBe(7);
      expect(days[0]?.getDay()).toBe(0); // 周日
      expect(days[6]?.getDay()).toBe(6); // 周六
    });
  });
});

// ============================================================
// Feature: 事件弹窗管理
// ============================================================

describe("Feature: 事件弹窗管理", () => {
  describe("Scenario: 打开新建事件弹窗", () => {
    it("Given 弹窗关闭, When 点击日历格子, Then 应该打开弹窗并设置初始时间", () => {
      // Given
      const store = createStore();
      expect(store.get(showEventModalAtom)).toBe(false);

      const startTime = new Date("2025-12-25T10:00:00");
      const endTime = new Date("2025-12-25T11:00:00");

      // When
      store.set(openNewEventModalAtom, { startTime, endTime });

      // Then
      expect(store.get(showEventModalAtom)).toBe(true);
      expect(store.get(editingEventAtom)).toBeNull();
      expect(store.get(newEventInitialDataAtom)).toEqual({ startTime, endTime });
    });
  });

  describe("Scenario: 打开编辑事件弹窗", () => {
    it("Given 弹窗关闭, When 点击某个事件, Then 应该打开弹窗并加载事件数据", () => {
      // Given
      const store = createStore();
      const event = createTestEvent({ id: 1, title: "待编辑事件" });

      // When
      store.set(openEditEventModalAtom, event);

      // Then
      expect(store.get(showEventModalAtom)).toBe(true);
      expect(store.get(editingEventAtom)).toEqual(event);
      expect(store.get(newEventInitialDataAtom)).toBeNull();
    });
  });

  describe("Scenario: 关闭事件弹窗", () => {
    it("Given 弹窗打开, When 关闭弹窗, Then 应该重置所有状态", () => {
      // Given
      const store = createStore();
      store.set(showEventModalAtom, true);
      store.set(editingEventAtom, createTestEvent());
      store.set(newEventInitialDataAtom, {
        startTime: new Date(),
        endTime: new Date(),
      });

      // When
      store.set(closeEventModalAtom);

      // Then
      expect(store.get(showEventModalAtom)).toBe(false);
      expect(store.get(editingEventAtom)).toBeNull();
      expect(store.get(newEventInitialDataAtom)).toBeNull();
    });
  });
});

// ============================================================
// Feature: 日历颜色映射
// ============================================================

describe("Feature: 日历颜色映射", () => {
  describe("Scenario: 获取日历颜色", () => {
    it("Given 有多个日历, Then 应该返回 ID 到颜色的映射", () => {
      // Given
      const store = createStore();
      store.set(calendarsAtom, [
        createTestCalendar({ id: 1, color: "#ef4444" }),
        createTestCalendar({ id: 2, color: "#3b82f6" }),
        createTestCalendar({ id: 3, color: "#22c55e" }),
      ]);

      // When
      const colorMap = store.get(calendarColorsAtom);

      // Then
      expect(colorMap).toEqual({
        1: "#ef4444",
        2: "#3b82f6",
        3: "#22c55e",
      });
    });
  });
});

