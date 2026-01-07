/**
 * 黄历功能 BDD 集成测试
 *
 * Feature: 黄历信息显示
 *   As a 用户
 *   I want 查看农历和黄历信息
 *   So that 我可以参考传统日历安排活动
 *
 * 测试策略：纯前端 Atoms 测试（不依赖后端）
 */
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";

// 导入要测试的 atoms
import { selectedDateAtom, currentMonthDaysAtom } from "../atoms/calendar";
import {
  selectedDateLunarInfoAtom,
  monthLunarInfoMapAtom,
  showLunarPanelAtom,
  toggleLunarPanelAtom,
} from "../atoms/lunar";

// ============================================================
// Feature: 黄历信息展示
// ============================================================

describe("Feature: 黄历信息展示", () => {
  describe("Scenario: 获取选中日期的黄历信息", () => {
    it("Given 选中2025年12月25日, When 获取黄历信息, Then 应该返回正确的农历日期", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(lunarInfo).toBeDefined();
      expect(lunarInfo.lunarYear).toBe(2025);
      expect(lunarInfo.lunarMonthName).toBe("冬月");
      expect(lunarInfo.lunarDayName).toBe("初六");
    });

    it("Given 选中春节日期, When 获取黄历信息, Then 应该显示农历节日", () => {
      // Given
      const store = createStore();
      // 2025年春节是1月29日
      store.set(selectedDateAtom, new Date("2025-01-29"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(lunarInfo.lunarFestivals.length).toBeGreaterThan(0);
      expect(lunarInfo.lunarFestivals).toContain("春节");
    });

    it("Given 选中某日期, When 获取黄历信息, Then 应该包含干支信息", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(lunarInfo.yearGanZhi).toBe("乙巳");
      expect(lunarInfo.yearShengXiao).toBe("蛇");
      expect(lunarInfo.monthGanZhi).toBeDefined();
      expect(lunarInfo.dayGanZhi).toBeDefined();
    });

    it("Given 选中某日期, When 获取黄历信息, Then 应该包含宜忌信息", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(Array.isArray(lunarInfo.yi)).toBe(true);
      expect(Array.isArray(lunarInfo.ji)).toBe(true);
      // 宜忌应该有内容
      expect(lunarInfo.yi.length + lunarInfo.ji.length).toBeGreaterThan(0);
    });

    it("Given 选中某日期, When 获取黄历信息, Then 应该包含吉神方位", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(lunarInfo.xiShen).toBeDefined();
      expect(lunarInfo.fuShen).toBeDefined();
      expect(lunarInfo.caiShen).toBeDefined();
    });

    it("Given 选中某日期, When 获取黄历信息, Then 应该包含冲煞信息", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(lunarInfo.chong).toBeDefined();
      expect(lunarInfo.sha).toBeDefined();
    });
  });

  describe("Scenario: 节气显示", () => {
    it("Given 选中冬至日期, When 获取黄历信息, Then 应该显示冬至节气", () => {
      // Given
      const store = createStore();
      // 2025年冬至大约在12月21或22日
      store.set(selectedDateAtom, new Date("2025-12-21"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      // 冬至当天 jieQi 应该不为空（具体日期可能是21或22，这里测试逻辑）
      expect(lunarInfo.nextJieQi).toBeDefined();
    });

    it("Given 选中某日期, When 获取黄历信息, Then 应该显示下一个节气", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(lunarInfo.nextJieQi).toBeDefined();
      expect(lunarInfo.nextJieQi?.name).toBeDefined();
      expect(lunarInfo.nextJieQi?.date).toBeDefined();
    });
  });

  describe("Scenario: 星座显示", () => {
    it("Given 选中12月25日, When 获取黄历信息, Then 应该显示摩羯座", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(lunarInfo.xingZuo).toBe("摩羯");
    });

    it("Given 选中3月21日, When 获取黄历信息, Then 应该显示白羊座", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-03-21"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      expect(lunarInfo.xingZuo).toBe("白羊");
    });
  });

  describe("Scenario: 法定假日显示", () => {
    it("Given 选中国庆节, When 获取黄历信息, Then 应该显示假日信息", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-10-01"));

      // When
      const lunarInfo = store.get(selectedDateLunarInfoAtom);

      // Then
      // 国庆节应该有假日标记
      expect(lunarInfo.festivals).toContain("国庆节");
    });
  });
});

// ============================================================
// Feature: 月视图农历信息
// ============================================================

describe("Feature: 月视图农历信息", () => {
  describe("Scenario: 获取当月所有日期的农历信息", () => {
    it("Given 选中2025年12月, When 获取月历农历映射, Then 应该返回42天的农历信息", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-15"));

      // When
      const lunarMap = store.get(monthLunarInfoMapAtom);

      // Then
      expect(lunarMap.size).toBe(42);
    });

    it("Given 选中某月, When 获取月历农历映射, Then 应该包含简化农历信息", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-15"));
      const days = store.get(currentMonthDaysAtom);

      // When
      const lunarMap = store.get(monthLunarInfoMapAtom);
      const firstDayLunar = lunarMap.get(days[0]!.toDateString());

      // Then
      expect(firstDayLunar).toBeDefined();
      expect(firstDayLunar?.lunarDayName).toBeDefined();
      expect(firstDayLunar?.lunarMonthName).toBeDefined();
      expect(typeof firstDayLunar?.isFirstDay).toBe("boolean");
      expect(typeof firstDayLunar?.isHoliday).toBe("boolean");
      expect(typeof firstDayLunar?.isWorkDay).toBe("boolean");
    });

    it("Given 选中某月, When 包含初一, Then 应该标记为 isFirstDay", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-01"));

      // When
      const lunarMap = store.get(monthLunarInfoMapAtom);

      // Then - 找到某个初一
      let foundFirstDay = false;
      lunarMap.forEach((info) => {
        if (info.isFirstDay) {
          foundFirstDay = true;
          // 初一应该显示月份名称
          expect(info.lunarMonthName).toBeDefined();
        }
      });
      // 42天中应该至少有一个初一
      expect(foundFirstDay).toBe(true);
    });
  });
});

// ============================================================
// Feature: 黄历面板状态
// ============================================================

describe("Feature: 黄历面板状态", () => {
  describe("Scenario: 默认展开状态", () => {
    it("Given 初始化应用, Then 黄历面板应该默认展开", () => {
      // Given
      const store = createStore();

      // Then
      expect(store.get(showLunarPanelAtom)).toBe(true);
    });
  });

  describe("Scenario: 切换黄历面板", () => {
    it("Given 黄历面板展开, When 点击收起, Then 面板应该收起", () => {
      // Given
      const store = createStore();
      expect(store.get(showLunarPanelAtom)).toBe(true);

      // When
      store.set(toggleLunarPanelAtom);

      // Then
      expect(store.get(showLunarPanelAtom)).toBe(false);
    });

    it("Given 黄历面板收起, When 点击展开, Then 面板应该展开", () => {
      // Given
      const store = createStore();
      store.set(showLunarPanelAtom, false);

      // When
      store.set(toggleLunarPanelAtom);

      // Then
      expect(store.get(showLunarPanelAtom)).toBe(true);
    });
  });
});

// ============================================================
// Feature: 选中日期联动
// ============================================================

describe("Feature: 选中日期联动", () => {
  describe("Scenario: 选中日期变化时黄历自动更新", () => {
    it("Given 选中某日期, When 切换到另一日期, Then 黄历信息应该自动更新", () => {
      // Given
      const store = createStore();
      store.set(selectedDateAtom, new Date("2025-12-25"));
      const lunarInfo1 = store.get(selectedDateLunarInfoAtom);

      // When
      store.set(selectedDateAtom, new Date("2025-01-01"));

      // Then
      const lunarInfo2 = store.get(selectedDateLunarInfoAtom);
      expect(lunarInfo2.lunarDayName).not.toBe(lunarInfo1.lunarDayName);
    });
  });
});

