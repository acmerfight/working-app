/**
 * 侧边栏功能 BDD 集成测试
 *
 * Feature: 侧边栏日历创建表单
 *   As a 用户
 *   I want 在侧边栏快速创建日历
 *   So that 我可以方便地管理我的日历
 *
 * 测试策略：纯前端 Atoms 测试（不依赖后端）
 */
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";

// 导入要测试的 atoms
import {
  isCreatingCalendarAtom,
  newCalendarNameAtom,
  newCalendarColorAtom,
  startCreatingCalendarAtom,
  cancelCreatingCalendarAtom,
  setNewCalendarNameAtom,
  setNewCalendarColorAtom,
} from "../atoms/sidebar";

// ============================================================
// Feature: 日历创建表单状态
// ============================================================

describe("Feature: 日历创建表单状态", () => {
  describe("Scenario: 初始状态", () => {
    it("Given 应用初始化, Then 创建表单应该隐藏且数据为空", () => {
      // Given
      const store = createStore();

      // Then
      expect(store.get(isCreatingCalendarAtom)).toBe(false);
      expect(store.get(newCalendarNameAtom)).toBe("");
      expect(store.get(newCalendarColorAtom)).toBe("#3b82f6");
    });
  });

  describe("Scenario: 开始创建日历", () => {
    it("Given 创建表单隐藏, When 点击添加按钮, Then 应该显示创建表单并重置数据", () => {
      // Given
      const store = createStore();
      // 假设之前有残留数据
      store.set(newCalendarNameAtom, "残留名称");
      store.set(newCalendarColorAtom, "#ef4444");
      expect(store.get(isCreatingCalendarAtom)).toBe(false);

      // When
      store.set(startCreatingCalendarAtom);

      // Then
      expect(store.get(isCreatingCalendarAtom)).toBe(true);
      expect(store.get(newCalendarNameAtom)).toBe(""); // 重置
      expect(store.get(newCalendarColorAtom)).toBe("#3b82f6"); // 重置为默认颜色
    });
  });

  describe("Scenario: 取消创建日历", () => {
    it("Given 创建表单显示, When 点击取消, Then 应该隐藏表单并重置数据", () => {
      // Given
      const store = createStore();
      store.set(isCreatingCalendarAtom, true);
      store.set(newCalendarNameAtom, "测试日历");
      store.set(newCalendarColorAtom, "#22c55e");

      // When
      store.set(cancelCreatingCalendarAtom);

      // Then
      expect(store.get(isCreatingCalendarAtom)).toBe(false);
      expect(store.get(newCalendarNameAtom)).toBe("");
      expect(store.get(newCalendarColorAtom)).toBe("#3b82f6");
    });
  });

  describe("Scenario: 输入日历名称", () => {
    it("Given 创建表单显示, When 用户输入名称, Then 应该更新名称状态", () => {
      // Given
      const store = createStore();
      store.set(isCreatingCalendarAtom, true);
      expect(store.get(newCalendarNameAtom)).toBe("");

      // When
      store.set(setNewCalendarNameAtom, "工作日历");

      // Then
      expect(store.get(newCalendarNameAtom)).toBe("工作日历");
    });

    it("Given 已有名称, When 用户清空输入, Then 名称应该变为空字符串", () => {
      // Given
      const store = createStore();
      store.set(newCalendarNameAtom, "测试日历");

      // When
      store.set(setNewCalendarNameAtom, "");

      // Then
      expect(store.get(newCalendarNameAtom)).toBe("");
    });
  });

  describe("Scenario: 选择日历颜色", () => {
    it("Given 创建表单显示, When 用户选择颜色, Then 应该更新颜色状态", () => {
      // Given
      const store = createStore();
      store.set(isCreatingCalendarAtom, true);
      expect(store.get(newCalendarColorAtom)).toBe("#3b82f6");

      // When
      store.set(setNewCalendarColorAtom, "#ef4444");

      // Then
      expect(store.get(newCalendarColorAtom)).toBe("#ef4444");
    });

    it("Given 用户选择多次颜色, Then 应该保留最后选择的颜色", () => {
      // Given
      const store = createStore();

      // When
      store.set(setNewCalendarColorAtom, "#ef4444");
      store.set(setNewCalendarColorAtom, "#22c55e");
      store.set(setNewCalendarColorAtom, "#8b5cf6");

      // Then
      expect(store.get(newCalendarColorAtom)).toBe("#8b5cf6");
    });
  });
});

// ============================================================
// Feature: 表单流程完整性
// ============================================================

describe("Feature: 表单流程完整性", () => {
  describe("Scenario: 完整的创建流程", () => {
    it("Given 初始状态, When 用户填写表单完整流程, Then 每步状态应该正确", () => {
      // Given
      const store = createStore();

      // Step 1: 点击添加按钮
      store.set(startCreatingCalendarAtom);
      expect(store.get(isCreatingCalendarAtom)).toBe(true);

      // Step 2: 输入名称
      store.set(setNewCalendarNameAtom, "个人日历");
      expect(store.get(newCalendarNameAtom)).toBe("个人日历");

      // Step 3: 选择颜色
      store.set(setNewCalendarColorAtom, "#ec4899");
      expect(store.get(newCalendarColorAtom)).toBe("#ec4899");

      // Step 4: 提交后取消（模拟创建成功后重置）
      store.set(cancelCreatingCalendarAtom);
      expect(store.get(isCreatingCalendarAtom)).toBe(false);
      expect(store.get(newCalendarNameAtom)).toBe("");
      expect(store.get(newCalendarColorAtom)).toBe("#3b82f6");
    });
  });

  describe("Scenario: 取消后重新开始", () => {
    it("Given 用户取消创建, When 重新开始创建, Then 表单应该是干净的", () => {
      // Given
      const store = createStore();
      store.set(startCreatingCalendarAtom);
      store.set(setNewCalendarNameAtom, "旧名称");
      store.set(setNewCalendarColorAtom, "#ef4444");
      store.set(cancelCreatingCalendarAtom);

      // When
      store.set(startCreatingCalendarAtom);

      // Then
      expect(store.get(isCreatingCalendarAtom)).toBe(true);
      expect(store.get(newCalendarNameAtom)).toBe("");
      expect(store.get(newCalendarColorAtom)).toBe("#3b82f6");
    });
  });
});

// ============================================================
// Feature: 边界情况
// ============================================================

describe("Feature: 边界情况", () => {
  describe("Scenario: 特殊字符名称", () => {
    it("Given 创建表单, When 输入包含特殊字符的名称, Then 应该正确保存", () => {
      // Given
      const store = createStore();

      // When
      store.set(setNewCalendarNameAtom, "工作 & 生活 📅");

      // Then
      expect(store.get(newCalendarNameAtom)).toBe("工作 & 生活 📅");
    });

    it("Given 创建表单, When 输入很长的名称, Then 应该正确保存", () => {
      // Given
      const store = createStore();
      const longName = "这是一个非常非常非常非常非常非常非常非常非常长的日历名称";

      // When
      store.set(setNewCalendarNameAtom, longName);

      // Then
      expect(store.get(newCalendarNameAtom)).toBe(longName);
    });
  });

  describe("Scenario: 空格处理", () => {
    it("Given 创建表单, When 输入只有空格的名称, Then 应该保存空格", () => {
      // Given
      const store = createStore();

      // When
      store.set(setNewCalendarNameAtom, "   ");

      // Then
      expect(store.get(newCalendarNameAtom)).toBe("   ");
      // 注意：实际提交时应该在业务层验证并 trim
    });
  });
});

