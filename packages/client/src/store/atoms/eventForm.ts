/**
 * 事件表单相关 Atoms
 * 管理 EventModal 的表单状态
 *
 * ✅ 遵循渲染状态分离：所有表单状态都在 atoms 中管理
 */
import { atom } from "jotai";
import {
  calendarsAtom,
  editingEventAtom,
  newEventInitialDataAtom,
  showEventModalAtom,
} from "./calendar";

// ============ State Atoms ============

export const eventFormTitleAtom = atom("");
export const eventFormDescriptionAtom = atom("");
export const eventFormStartDateAtom = atom("");
export const eventFormStartTimeAtom = atom("");
export const eventFormEndDateAtom = atom("");
export const eventFormEndTimeAtom = atom("");
export const eventFormIsAllDayAtom = atom(false);
export const eventFormLocationAtom = atom("");
export const eventFormCalendarIdAtom = atom<number | "">("");
export const eventFormRecurrenceRuleAtom = atom("");

// ============ Helper Functions ============

/**
 * 格式化日期为 input[type="date"] 格式
 */
function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

/**
 * 格式化时间为 input[type="time"] 格式
 */
function formatTimeForInput(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

// ============ Derived Atoms ============

/**
 * 是否为编辑模式
 */
export const isEditingEventAtom = atom((get) => {
  return get(editingEventAtom) !== null;
});

/**
 * 提交按钮是否可用
 */
export const canSubmitEventFormAtom = atom((get) => {
  const title = get(eventFormTitleAtom);
  const calendarId = get(eventFormCalendarIdAtom);
  return title.trim() !== "" && calendarId !== "";
});

// ============ Action Atoms ============

/**
 * 设置标题
 */
export const setEventFormTitleAtom = atom(null, (_get, set, value: string) => {
  set(eventFormTitleAtom, value);
});

/**
 * 设置描述
 */
export const setEventFormDescriptionAtom = atom(
  null,
  (_get, set, value: string) => {
    set(eventFormDescriptionAtom, value);
  }
);

/**
 * 设置开始日期
 */
export const setEventFormStartDateAtom = atom(
  null,
  (_get, set, value: string) => {
    set(eventFormStartDateAtom, value);
  }
);

/**
 * 设置开始时间
 */
export const setEventFormStartTimeAtom = atom(
  null,
  (_get, set, value: string) => {
    set(eventFormStartTimeAtom, value);
  }
);

/**
 * 设置结束日期
 */
export const setEventFormEndDateAtom = atom(
  null,
  (_get, set, value: string) => {
    set(eventFormEndDateAtom, value);
  }
);

/**
 * 设置结束时间
 */
export const setEventFormEndTimeAtom = atom(
  null,
  (_get, set, value: string) => {
    set(eventFormEndTimeAtom, value);
  }
);

/**
 * 设置是否全天
 */
export const setEventFormIsAllDayAtom = atom(
  null,
  (_get, set, value: boolean) => {
    set(eventFormIsAllDayAtom, value);
  }
);

/**
 * 设置地点
 */
export const setEventFormLocationAtom = atom(
  null,
  (_get, set, value: string) => {
    set(eventFormLocationAtom, value);
  }
);

/**
 * 设置日历 ID
 */
export const setEventFormCalendarIdAtom = atom(
  null,
  (_get, set, value: number | "") => {
    set(eventFormCalendarIdAtom, value);
  }
);

/**
 * 设置重复规则
 */
export const setEventFormRecurrenceRuleAtom = atom(
  null,
  (_get, set, value: string) => {
    set(eventFormRecurrenceRuleAtom, value);
  }
);

/**
 * 重置表单
 */
export const resetEventFormAtom = atom(null, (_get, set) => {
  set(eventFormTitleAtom, "");
  set(eventFormDescriptionAtom, "");
  set(eventFormStartDateAtom, "");
  set(eventFormStartTimeAtom, "");
  set(eventFormEndDateAtom, "");
  set(eventFormEndTimeAtom, "");
  set(eventFormIsAllDayAtom, false);
  set(eventFormLocationAtom, "");
  set(eventFormCalendarIdAtom, "");
  set(eventFormRecurrenceRuleAtom, "");
});

/**
 * 根据弹窗状态初始化表单
 * 当弹窗打开时，根据编辑/新建模式填充表单
 */
export const initEventFormAtom = atom(null, (get, set) => {
  const showModal = get(showEventModalAtom);
  if (!showModal) return;

  const editingEvent = get(editingEventAtom);
  const initialData = get(newEventInitialDataAtom);
  const calendars = get(calendarsAtom);

  if (editingEvent) {
    // 编辑模式
    const start = new Date(editingEvent.startTime);
    const end = new Date(editingEvent.endTime);

    set(eventFormTitleAtom, editingEvent.title);
    set(eventFormDescriptionAtom, editingEvent.description ?? "");
    set(eventFormStartDateAtom, formatDateForInput(start));
    set(eventFormStartTimeAtom, formatTimeForInput(start));
    set(eventFormEndDateAtom, formatDateForInput(end));
    set(eventFormEndTimeAtom, formatTimeForInput(end));
    set(eventFormIsAllDayAtom, editingEvent.isAllDay);
    set(eventFormLocationAtom, editingEvent.location ?? "");
    set(eventFormCalendarIdAtom, editingEvent.calendarId);
    set(eventFormRecurrenceRuleAtom, editingEvent.recurrenceRule ?? "");
  } else if (initialData) {
    // 新建模式，有初始数据
    set(eventFormTitleAtom, "");
    set(eventFormDescriptionAtom, "");
    set(eventFormStartDateAtom, formatDateForInput(initialData.startTime));
    set(eventFormStartTimeAtom, formatTimeForInput(initialData.startTime));
    set(eventFormEndDateAtom, formatDateForInput(initialData.endTime));
    set(eventFormEndTimeAtom, formatTimeForInput(initialData.endTime));
    set(eventFormIsAllDayAtom, false);
    set(eventFormLocationAtom, "");
    set(eventFormCalendarIdAtom, calendars[0]?.id ?? "");
    set(eventFormRecurrenceRuleAtom, "");
  } else {
    // 新建模式，无初始数据
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const endDefault = new Date(now);
    endDefault.setHours(now.getHours() + 1);

    set(eventFormTitleAtom, "");
    set(eventFormDescriptionAtom, "");
    set(eventFormStartDateAtom, formatDateForInput(now));
    set(eventFormStartTimeAtom, formatTimeForInput(now));
    set(eventFormEndDateAtom, formatDateForInput(endDefault));
    set(eventFormEndTimeAtom, formatTimeForInput(endDefault));
    set(eventFormIsAllDayAtom, false);
    set(eventFormLocationAtom, "");
    set(eventFormCalendarIdAtom, calendars[0]?.id ?? "");
    set(eventFormRecurrenceRuleAtom, "");
  }
});

/**
 * 获取表单数据（用于提交）
 */
export const getEventFormDataAtom = atom((get) => {
  const title = get(eventFormTitleAtom);
  const description = get(eventFormDescriptionAtom);
  const startDate = get(eventFormStartDateAtom);
  const startTime = get(eventFormStartTimeAtom);
  const endDate = get(eventFormEndDateAtom);
  const endTime = get(eventFormEndTimeAtom);
  const isAllDay = get(eventFormIsAllDayAtom);
  const location = get(eventFormLocationAtom);
  const calendarId = get(eventFormCalendarIdAtom);
  const recurrenceRule = get(eventFormRecurrenceRuleAtom);

  if (!title.trim() || calendarId === "") {
    return null;
  }

  const startDateTime = new Date(`${startDate}T${startTime || "00:00"}`);
  const endDateTime = new Date(`${endDate}T${endTime || "23:59"}`);

  return {
    calendarId: calendarId as number,
    title: title.trim(),
    startTime: startDateTime,
    endTime: endDateTime,
    isAllDay,
    ...(description.trim() ? { description: description.trim() } : {}),
    ...(location.trim() ? { location: location.trim() } : {}),
    ...(recurrenceRule ? { recurrenceRule } : {}),
  };
});

