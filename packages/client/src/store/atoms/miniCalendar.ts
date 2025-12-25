/**
 * 迷你日历相关 Atoms
 * 管理 MiniCalendar 组件的状态
 *
 * ✅ 遵循渲染状态分离：所有 UI 状态都在 atoms 中管理
 */
import { atom } from "jotai";
import { selectedDateAtom } from "./calendar";

// ============ State Atoms ============

/**
 * 迷你日历当前显示的月份
 */
export const miniCalendarDisplayMonthAtom = atom<Date>(new Date());

// ============ Derived Atoms ============

/**
 * 获取当前显示月份的所有日期（含空白填充）
 */
export const miniCalendarDaysAtom = atom((get) => {
  const displayMonth = get(miniCalendarDisplayMonthAtom);
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();

  const days: (Date | null)[] = [];

  // 填充空白
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // 当月日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  return days;
});

/**
 * 显示的年份
 */
export const miniCalendarYearAtom = atom((get) => {
  return get(miniCalendarDisplayMonthAtom).getFullYear();
});

/**
 * 显示的月份（1-12）
 */
export const miniCalendarMonthAtom = atom((get) => {
  return get(miniCalendarDisplayMonthAtom).getMonth() + 1;
});

// ============ Action Atoms ============

/**
 * 切换到上个月
 */
export const goToPrevMiniMonthAtom = atom(null, (get, set) => {
  const current = get(miniCalendarDisplayMonthAtom);
  set(
    miniCalendarDisplayMonthAtom,
    new Date(current.getFullYear(), current.getMonth() - 1, 1)
  );
});

/**
 * 切换到下个月
 */
export const goToNextMiniMonthAtom = atom(null, (get, set) => {
  const current = get(miniCalendarDisplayMonthAtom);
  set(
    miniCalendarDisplayMonthAtom,
    new Date(current.getFullYear(), current.getMonth() + 1, 1)
  );
});

/**
 * 设置显示月份（当选中日期改变时同步）
 */
export const syncMiniCalendarWithSelectedDateAtom = atom(null, (get, set) => {
  const selectedDate = get(selectedDateAtom);
  set(
    miniCalendarDisplayMonthAtom,
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
});

/**
 * 初始化迷你日历显示月份（根据当前选中日期）
 */
export const initMiniCalendarAtom = atom(null, (get, set) => {
  const selectedDate = get(selectedDateAtom);
  set(
    miniCalendarDisplayMonthAtom,
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
});

