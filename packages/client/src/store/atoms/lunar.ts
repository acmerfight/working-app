/**
 * 黄历相关 Atoms
 * 遵循渲染状态分离原则：所有状态和派生计算都在 atoms 中
 */
import { atom } from "jotai";
import {
  getLunarInfo,
  getSimpleLunarInfo,
  type LunarInfo,
} from "../../lib/lunar";
import { currentMonthDaysAtom, selectedDateAtom } from "./calendar";

// ============ Derived Atoms ============

/**
 * 当前选中日期的黄历信息（派生 atom）
 */
export const selectedDateLunarInfoAtom = atom<LunarInfo>((get) => {
  const selectedDate = get(selectedDateAtom);
  return getLunarInfo(selectedDate);
});

/**
 * 当前月份所有日期的简化农历信息映射（派生 atom）
 * 用于月视图显示农历日期
 */
export const monthLunarInfoMapAtom = atom((get) => {
  const days = get(currentMonthDaysAtom);
  const map = new Map<string, ReturnType<typeof getSimpleLunarInfo>>();
  
  days.forEach((date) => {
    const key = date.toDateString();
    map.set(key, getSimpleLunarInfo(date));
  });
  
  return map;
});

// ============ UI State Atoms ============

/**
 * 黄历面板是否展开
 */
export const showLunarPanelAtom = atom(true);

/**
 * 切换黄历面板显示状态
 */
export const toggleLunarPanelAtom = atom(null, (get, set) => {
  set(showLunarPanelAtom, !get(showLunarPanelAtom));
});

