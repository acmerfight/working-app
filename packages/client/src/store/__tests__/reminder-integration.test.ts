/**
 * 提醒功能 BDD 集成测试
 *
 * Feature: 事件提醒
 *   As a 用户
 *   I want 为事件设置提醒
 *   So that 我不会错过重要的日程
 *
 * 测试策略：Atoms + Hono app（不启动服务器）
 */
import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 直接导入 Hono app
import { app } from "@working-app/server/app";

// 导入要测试的 atoms
import {
  pendingRemindersAtom,
  notificationPermissionAtom,
  reminderCheckEnabledAtom,
  requestNotificationPermissionAtom,
  fetchPendingRemindersAtom,
  markReminderSentAtom,
  createEventReminderAtom,
} from "../atoms/reminder";

import { calendarsAtom, eventsAtom, createCalendarAtom, createEventAtom } from "../atoms/calendar";

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
 * Mock Notification API
 */
function mockNotificationAPI(permission: NotificationPermission = "default") {
  const mockNotification = vi.fn().mockImplementation(() => ({
    onclick: null,
    close: vi.fn(),
  })) as unknown as typeof Notification & { requestPermission: ReturnType<typeof vi.fn> };

  Object.defineProperty(mockNotification, "permission", {
    get: () => permission,
    configurable: true,
  });

  mockNotification.requestPermission = vi.fn().mockResolvedValue(permission);

  vi.stubGlobal("Notification", mockNotification);
  return mockNotification;
}

// ============================================================
// Feature: 通知权限管理
// ============================================================

describe("Feature: 通知权限管理", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 初始状态", () => {
    it("Given 应用初始化, Then 通知权限应该是默认状态", () => {
      // Given
      const store = createStore();

      // Then
      expect(store.get(notificationPermissionAtom)).toBe("default");
      expect(store.get(reminderCheckEnabledAtom)).toBe(true);
      expect(store.get(pendingRemindersAtom)).toEqual([]);
    });
  });

  describe("Scenario: 请求通知权限", () => {
    it("Given 浏览器支持通知, When 请求权限且用户同意, Then 权限应该变为 granted", async () => {
      // Given
      const store = createStore();
      mockNotificationAPI("granted");

      // When
      await store.set(requestNotificationPermissionAtom);

      // Then
      expect(store.get(notificationPermissionAtom)).toBe("granted");
    });

    it("Given 浏览器支持通知, When 请求权限且用户拒绝, Then 权限应该变为 denied", async () => {
      // Given
      const store = createStore();
      mockNotificationAPI("denied");

      // When
      await store.set(requestNotificationPermissionAtom);

      // Then
      expect(store.get(notificationPermissionAtom)).toBe("denied");
    });

    it("Given 浏览器不支持通知, When 请求权限, Then 应该静默失败", async () => {
      // Given
      const store = createStore();
      // 不设置 Notification，模拟不支持

      // When
      await store.set(requestNotificationPermissionAtom);

      // Then - 不应该抛出错误
      expect(store.get(notificationPermissionAtom)).toBe("default");
    });
  });
});

// ============================================================
// Feature: 提醒管理
// ============================================================

describe("Feature: 提醒管理", () => {
  beforeEach(() => {
    setupHonoFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 获取待处理提醒", () => {
    it("Given 服务器有提醒数据, When 获取待处理提醒, Then 应该返回提醒列表", async () => {
      // Given
      const store = createStore();

      // When
      const reminders = await store.set(fetchPendingRemindersAtom);

      // Then
      expect(Array.isArray(reminders)).toBe(true);
    });
  });

  describe("Scenario: 创建事件提醒", () => {
    it("Given 存在一个事件, When 为事件创建提醒, Then 应该成功创建提醒", async () => {
      // Given
      const store = createStore();
      // 先创建日历
      await store.set(createCalendarAtom, { name: "测试日历", color: "#3b82f6" });
      const calendars = store.get(calendarsAtom);
      const calendarId = calendars[calendars.length - 1]?.id ?? 1;

      // 创建事件
      const startTime = new Date(Date.now() + 60 * 60 * 1000); // 1小时后
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      await store.set(createEventAtom, {
        calendarId,
        title: "需要提醒的会议",
        startTime,
        endTime,
      });

      const events = store.get(eventsAtom);
      const eventId = events[events.length - 1]?.id ?? 1;

      // When
      const result = await store.set(createEventReminderAtom, {
        eventId,
        minutesBefore: 15,
      });

      // Then
      expect(result).toBeDefined();
    });
  });

  describe("Scenario: 标记提醒已发送", () => {
    it("Given 有待处理的提醒, When 标记为已发送, Then 应该从待处理列表移除", async () => {
      // Given
      const store = createStore();
      // 模拟有待处理的提醒
      store.set(pendingRemindersAtom, [
        {
          id: 1,
          eventId: 1,
          reminderTime: new Date().toISOString(),
          type: "notification" as const,
          isSent: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          eventId: 2,
          reminderTime: new Date().toISOString(),
          type: "notification" as const,
          isSent: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(store.get(pendingRemindersAtom).length).toBe(2);

      // When
      await store.set(markReminderSentAtom, 1);

      // Then - 即使 API 调用失败，也应该从本地列表移除
      const pending = store.get(pendingRemindersAtom);
      expect(pending.find((r) => r.id === 1)).toBeUndefined();
    });
  });
});

// ============================================================
// Feature: 提醒检查开关
// ============================================================

describe("Feature: 提醒检查开关", () => {
  describe("Scenario: 默认启用", () => {
    it("Given 应用初始化, Then 提醒检查应该默认启用", () => {
      // Given
      const store = createStore();

      // Then
      expect(store.get(reminderCheckEnabledAtom)).toBe(true);
    });
  });

  describe("Scenario: 切换提醒检查状态", () => {
    it("Given 提醒检查启用, When 禁用, Then 状态应该变为 false", () => {
      // Given
      const store = createStore();
      expect(store.get(reminderCheckEnabledAtom)).toBe(true);

      // When
      store.set(reminderCheckEnabledAtom, false);

      // Then
      expect(store.get(reminderCheckEnabledAtom)).toBe(false);
    });
  });
});

// ============================================================
// Feature: 提醒状态管理
// ============================================================

describe("Feature: 提醒状态管理", () => {
  describe("Scenario: 直接操作待处理提醒列表", () => {
    it("Given 有多个待处理提醒, When 手动过滤列表, Then 应该只保留未处理的提醒", () => {
      // Given
      const store = createStore();
      
      // 模拟本地有两个待处理提醒
      const reminders = [
        {
          id: 100,
          eventId: 1,
          reminderTime: new Date().toISOString(),
          type: "notification" as const,
          isSent: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 200,
          eventId: 2,
          reminderTime: new Date().toISOString(),
          type: "notification" as const,
          isSent: false,
          createdAt: new Date().toISOString(),
        },
      ];
      store.set(pendingRemindersAtom, reminders);
      expect(store.get(pendingRemindersAtom).length).toBe(2);

      // When - 模拟移除 id=100 的提醒
      store.set(pendingRemindersAtom, reminders.filter(r => r.id !== 100));

      // Then - 本地列表应该只保留 id=200
      const remaining = store.get(pendingRemindersAtom);
      expect(remaining.length).toBe(1);
      expect(remaining[0]?.id).toBe(200);
    });
  });
});

