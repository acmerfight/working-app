/**
 * ErrorBoundary 状态管理测试
 *
 * Feature: 错误边界状态管理
 *   As a 开发者
 *   I want 应用能够捕获和管理渲染错误
 *   So that 用户能看到友好的错误界面并能恢复
 */
import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearErrorHistoryAtom,
  errorHistoryAtom,
  hasRenderErrorAtom,
  isRecoveringAtom,
  logErrorAtom,
  recoverFromErrorAtom,
  renderErrorAtom,
  type AppError,
} from "../atoms/error";

// ============================================================
// 测试辅助函数
// ============================================================

function createTestStore() {
  return createStore();
}

function createTestError(message: string): Error {
  const error = new Error(message);
  error.stack = `Error: ${message}\n    at TestComponent (test.tsx:10:5)`;
  return error;
}

// ============================================================
// Feature: 错误边界状态管理
// ============================================================

describe("Feature: 错误边界状态管理", () => {
  beforeEach(() => {
    vi.spyOn(console, "group").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "groupEnd").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Scenario: 记录渲染错误", () => {
    it("Given 应用正常运行, When 组件抛出错误, Then 应该记录错误信息", () => {
      // Given
      const store = createTestStore();
      expect(store.get(renderErrorAtom)).toBeNull();
      expect(store.get(hasRenderErrorAtom)).toBe(false);

      // When
      const error = createTestError("Component crashed");
      store.set(logErrorAtom, error, {
        componentStack: "\n    at Counter\n    at App",
      });

      // Then
      const recordedError = store.get(renderErrorAtom);
      expect(recordedError).not.toBeNull();
      expect(recordedError?.message).toBe("Component crashed");
      expect(recordedError?.componentStack).toBe("\n    at Counter\n    at App");
      expect(store.get(hasRenderErrorAtom)).toBe(true);
    });

    it("Given 发生错误, Then 错误应该被添加到历史记录", () => {
      // Given
      const store = createTestStore();
      expect(store.get(errorHistoryAtom)).toHaveLength(0);

      // When
      store.set(logErrorAtom, createTestError("Error 1"));
      store.set(logErrorAtom, createTestError("Error 2"));

      // Then
      const history = store.get(errorHistoryAtom);
      expect(history).toHaveLength(2);
      expect(history[0]?.message).toBe("Error 2"); // 最新的在前面
      expect(history[1]?.message).toBe("Error 1");
    });

    it("Given 历史记录超过 10 条, Then 只保留最近 10 条", () => {
      // Given
      const store = createTestStore();

      // When - 记录 15 个错误
      for (let i = 1; i <= 15; i++) {
        store.set(logErrorAtom, createTestError(`Error ${String(i)}`));
      }

      // Then
      const history = store.get(errorHistoryAtom);
      expect(history).toHaveLength(10);
      expect(history[0]?.message).toBe("Error 15"); // 最新的
      expect(history[9]?.message).toBe("Error 6"); // 第 6 个是最老的（保留的）
    });

    it("Given 记录错误, Then 错误应该包含唯一 ID 和时间戳", () => {
      // Given
      const store = createTestStore();
      const beforeTime = Date.now();

      // When
      store.set(logErrorAtom, createTestError("Test error"));

      // Then
      const error = store.get(renderErrorAtom);
      expect(error?.id).toMatch(/^error_\d+_[a-z0-9]+$/);
      expect(error?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(error?.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("Scenario: 从错误中恢复", () => {
    it("Given 存在渲染错误, When 用户点击恢复, Then 错误应该被清除", async () => {
      // Given
      const store = createTestStore();
      store.set(logErrorAtom, createTestError("Fatal error"));
      expect(store.get(renderErrorAtom)).not.toBeNull();

      // When
      await store.set(recoverFromErrorAtom);

      // Then
      expect(store.get(renderErrorAtom)).toBeNull();
      expect(store.get(hasRenderErrorAtom)).toBe(false);
    });

    it("Given 恢复过程中, Then isRecovering 应该为 true", async () => {
      // Given
      const store = createTestStore();
      store.set(logErrorAtom, createTestError("Error"));
      const recoveringHistory: boolean[] = [];

      // 订阅 isRecovering 变化
      store.sub(isRecoveringAtom, () => {
        recoveringHistory.push(store.get(isRecoveringAtom));
      });

      // When
      await store.set(recoverFromErrorAtom);

      // Then - 应该经历 true → false
      expect(recoveringHistory).toEqual([true, false]);
      expect(store.get(isRecoveringAtom)).toBe(false);
    });
  });

  describe("Scenario: 清除错误历史", () => {
    it("Given 存在错误历史, When 清除历史, Then 所有错误记录应该被删除", () => {
      // Given
      const store = createTestStore();
      store.set(logErrorAtom, createTestError("Error 1"));
      store.set(logErrorAtom, createTestError("Error 2"));
      expect(store.get(errorHistoryAtom)).toHaveLength(2);
      expect(store.get(renderErrorAtom)).not.toBeNull();

      // When
      store.set(clearErrorHistoryAtom);

      // Then
      expect(store.get(errorHistoryAtom)).toHaveLength(0);
      expect(store.get(renderErrorAtom)).toBeNull();
    });
  });

  describe("Scenario: 派生状态 hasRenderError", () => {
    it("Given 无错误, Then hasRenderError 应该为 false", () => {
      const store = createTestStore();
      expect(store.get(hasRenderErrorAtom)).toBe(false);
    });

    it("Given 存在错误, Then hasRenderError 应该为 true", () => {
      const store = createTestStore();
      store.set(logErrorAtom, createTestError("Error"));
      expect(store.get(hasRenderErrorAtom)).toBe(true);
    });

    it("Given 错误被清除, Then hasRenderError 应该变回 false", async () => {
      const store = createTestStore();
      store.set(logErrorAtom, createTestError("Error"));
      expect(store.get(hasRenderErrorAtom)).toBe(true);

      await store.set(recoverFromErrorAtom);
      expect(store.get(hasRenderErrorAtom)).toBe(false);
    });
  });
});

// ============================================================
// Feature: 错误信息完整性
// ============================================================

describe("Feature: 错误信息完整性", () => {
  beforeEach(() => {
    vi.spyOn(console, "group").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "groupEnd").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Scenario: 记录完整的错误信息", () => {
    it("Given 组件抛出错误, Then 应该记录消息、堆栈和组件栈", () => {
      // Given
      const store = createTestStore();
      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at Component (file.tsx:1:1)";

      // When
      store.set(logErrorAtom, error, {
        componentStack: "\n    at MyComponent\n    at App",
      });

      // Then
      const recorded = store.get(renderErrorAtom) as AppError;
      expect(recorded.message).toBe("Test error");
      expect(recorded.stack).toBe("Error: Test error\n    at Component (file.tsx:1:1)");
      expect(recorded.componentStack).toBe("\n    at MyComponent\n    at App");
    });

    it("Given 没有 componentStack, Then componentStack 应该为 undefined", () => {
      // Given
      const store = createTestStore();

      // When
      store.set(logErrorAtom, createTestError("Error"));

      // Then
      const recorded = store.get(renderErrorAtom);
      expect(recorded?.componentStack).toBeUndefined();
    });

    it("Given componentStack 为 null, Then componentStack 应该为 undefined", () => {
      // Given
      const store = createTestStore();

      // When
      store.set(logErrorAtom, createTestError("Error"), {
        componentStack: null,
      });

      // Then
      const recorded = store.get(renderErrorAtom);
      expect(recorded?.componentStack).toBeUndefined();
    });
  });
});

