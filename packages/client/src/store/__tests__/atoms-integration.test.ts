/**
 * 前后端集成测试
 *
 * 测试策略：Atoms + Hono app（不启动服务器）
 * - 前端状态逻辑 + 真实后端 API 一起测试
 * - 快速、稳定、真实
 */
import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 直接导入 Hono app（不需要启动服务器）
import { app } from "@working-app/server/app";

// 导入要测试的 atoms
import {
  apiErrorAtom,
  apiLoadingAtom,
  apiMessageAtom,
  countAtom,
  decrementAtom,
  doubleCountAtom,
  echoInputAtom,
  fetchMessageAtom,
  incrementAtom,
  resetCountAtom,
  sendEchoAtom,
} from "../atoms";

// ============================================================
// 测试辅助函数
// ============================================================

/**
 * 创建一个配置好 Hono app 作为后端的测试 store
 */
function createTestStore() {
  return createStore();
}

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
function trackAtomChanges<T>(store: ReturnType<typeof createStore>, atom: typeof apiLoadingAtom) {
  const history: T[] = [];
  store.sub(atom, () => {
    history.push(store.get(atom) as T);
  });
  return history;
}

// ============================================================
// Feature: 计数器
// ============================================================

describe("Feature: 计数器", () => {
  describe("Scenario: 增加计数", () => {
    it("Given 当前计数为 0, When 用户点击 +1, Then 计数应该变为 1", () => {
      // Given
      const store = createTestStore();
      expect(store.get(countAtom)).toBe(0);

      // When
      store.set(incrementAtom);

      // Then
      expect(store.get(countAtom)).toBe(1);
    });

    it("Given 当前计数为 1, When 用户连续点击 +1 两次, Then 计数应该变为 3", () => {
      // Given
      const store = createTestStore();
      store.set(countAtom, 1);

      // When
      store.set(incrementAtom);
      store.set(incrementAtom);

      // Then
      expect(store.get(countAtom)).toBe(3);
    });
  });

  describe("Scenario: 减少计数", () => {
    it("Given 当前计数为 5, When 用户点击 -1, Then 计数应该变为 4", () => {
      // Given
      const store = createTestStore();
      store.set(countAtom, 5);

      // When
      store.set(decrementAtom);

      // Then
      expect(store.get(countAtom)).toBe(4);
    });
  });

  describe("Scenario: 重置计数", () => {
    it("Given 当前计数为 100, When 用户点击重置, Then 计数应该变为 0", () => {
      // Given
      const store = createTestStore();
      store.set(countAtom, 100);

      // When
      store.set(resetCountAtom);

      // Then
      expect(store.get(countAtom)).toBe(0);
    });
  });

  describe("Scenario: 派生双倍值", () => {
    it("Given 当前计数为 7, Then 双倍值应该为 14", () => {
      // Given
      const store = createTestStore();
      store.set(countAtom, 7);

      // Then
      expect(store.get(doubleCountAtom)).toBe(14);
    });
  });
});

// ============================================================
// Feature: API 交互（前后端联调）
// ============================================================

describe("Feature: API 交互", () => {
  beforeEach(() => {
    setupHonoFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 获取问候消息", () => {
    it("Given 用户打开页面, When 调用 fetchMessage, Then 应该显示服务器问候语", async () => {
      // Given
      const store = createTestStore();
      expect(store.get(apiMessageAtom)).toBeNull();
      expect(store.get(apiLoadingAtom)).toBe(false);

      // When
      await store.set(fetchMessageAtom);

      // Then - 真实的 Hono 响应
      expect(store.get(apiMessageAtom)).toBe("Hello from Hono! 🔥");
      expect(store.get(apiLoadingAtom)).toBe(false);
      expect(store.get(apiErrorAtom)).toBeNull();
    });

    it("Given 调用 fetchMessage, Then Loading 状态应该经历 false → true → false", async () => {
      // Given
      const store = createTestStore();
      const loadingHistory = trackAtomChanges<boolean>(store, apiLoadingAtom);
      expect(store.get(apiLoadingAtom)).toBe(false);

      // When
      await store.set(fetchMessageAtom);

      // Then - 验证 loading 状态变化历史
      expect(loadingHistory).toEqual([true, false]);
      expect(store.get(apiLoadingAtom)).toBe(false);
    });
  });

  describe("Scenario: 发送 Echo 消息", () => {
    it("Given 用户输入消息, When 发送 echo 请求, Then 应该收到服务器回显", async () => {
      // Given
      const store = createTestStore();
      store.set(echoInputAtom, "Hello World");

      // When
      await store.set(sendEchoAtom);

      // Then - 真实的 Hono echo 响应
      expect(store.get(apiMessageAtom)).toBe('Server received: "Hello World"');
      expect(store.get(echoInputAtom)).toBe(""); // 输入应该被清空
      expect(store.get(apiErrorAtom)).toBeNull();
    });

    it("Given 发送 echo 请求, Then Loading 状态应该经历 false → true → false", async () => {
      // Given
      const store = createTestStore();
      store.set(echoInputAtom, "Test");
      const loadingHistory = trackAtomChanges<boolean>(store, apiLoadingAtom);

      // When
      await store.set(sendEchoAtom);

      // Then - 验证 loading 状态变化历史
      expect(loadingHistory).toEqual([true, false]);
    });

    it("Given 用户输入为空, When 尝试发送, Then 不应该发送请求也不应该触发 loading", async () => {
      // Given
      const store = createTestStore();
      store.set(echoInputAtom, "   "); // 只有空格
      const loadingHistory = trackAtomChanges<boolean>(store, apiLoadingAtom);

      // When
      await store.set(sendEchoAtom);

      // Then - 没有 loading 变化
      expect(loadingHistory).toEqual([]);
      expect(store.get(apiMessageAtom)).toBeNull();
    });
  });

  describe("Scenario: API 错误处理", () => {
    it("Given 网络故障, When 调用 API, Then 应该显示错误信息且 loading 正确结束", async () => {
      // Given
      const store = createTestStore();
      const loadingHistory = trackAtomChanges<boolean>(store, apiLoadingAtom);
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

      // When
      await store.set(fetchMessageAtom);

      // Then - 即使出错，loading 也应该正确结束
      expect(store.get(apiErrorAtom)).toBe("Network error");
      expect(store.get(apiLoadingAtom)).toBe(false);
      expect(loadingHistory).toEqual([true, false]);
    });

    it("Given 服务器返回错误, When 调用不存在的 API, Then 应该显示错误信息", async () => {
      // Given
      const store = createTestStore();
      vi.stubGlobal("fetch", async () => {
        return app.request("http://localhost/api/not-exist");
      });

      // When
      await store.set(fetchMessageAtom);

      // Then
      expect(store.get(apiErrorAtom)).not.toBeNull();
    });
  });
});

