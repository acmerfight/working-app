/**
 * 侧边栏相关 Atoms
 * 管理侧边栏 UI 状态，遵循渲染状态分离原则
 */
import { atom } from "jotai";

// ============ State Atoms ============

/**
 * 是否正在创建日历
 */
export const isCreatingCalendarAtom = atom(false);

/**
 * 新日历名称输入
 */
export const newCalendarNameAtom = atom("");

/**
 * 新日历颜色选择
 */
export const newCalendarColorAtom = atom("#3b82f6");

// ============ Action Atoms ============

/**
 * 开始创建日历
 */
export const startCreatingCalendarAtom = atom(null, (_get, set) => {
  set(isCreatingCalendarAtom, true);
  set(newCalendarNameAtom, "");
  set(newCalendarColorAtom, "#3b82f6");
});

/**
 * 取消创建日历
 */
export const cancelCreatingCalendarAtom = atom(null, (_get, set) => {
  set(isCreatingCalendarAtom, false);
  set(newCalendarNameAtom, "");
  set(newCalendarColorAtom, "#3b82f6");
});

/**
 * 设置新日历名称
 */
export const setNewCalendarNameAtom = atom(null, (_get, set, name: string) => {
  set(newCalendarNameAtom, name);
});

/**
 * 设置新日历颜色
 */
export const setNewCalendarColorAtom = atom(null, (_get, set, color: string) => {
  set(newCalendarColorAtom, color);
});

