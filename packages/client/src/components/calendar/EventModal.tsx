/**
 * 事件编辑弹窗组件
 *
 * ✅ 遵循渲染状态分离：
 * - 所有表单状态都来自 eventForm atoms
 * - 所有操作都通过 action atoms
 * - 组件只负责 UI 渲染
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  calendarsAtom,
  closeEventModalAtom,
  createEventAtom,
  deleteEventAtom,
  editingEventAtom,
  showEventModalAtom,
  updateEventAtom,
} from "../../store/atoms/calendar";
import {
  canSubmitEventFormAtom,
  eventFormCalendarIdAtom,
  eventFormDescriptionAtom,
  eventFormEndDateAtom,
  eventFormEndTimeAtom,
  eventFormIsAllDayAtom,
  eventFormLocationAtom,
  eventFormRecurrenceRuleAtom,
  eventFormStartDateAtom,
  eventFormStartTimeAtom,
  eventFormTitleAtom,
  getEventFormDataAtom,
  initEventFormAtom,
  isEditingEventAtom,
  setEventFormCalendarIdAtom,
  setEventFormDescriptionAtom,
  setEventFormEndDateAtom,
  setEventFormEndTimeAtom,
  setEventFormIsAllDayAtom,
  setEventFormLocationAtom,
  setEventFormRecurrenceRuleAtom,
  setEventFormStartDateAtom,
  setEventFormStartTimeAtom,
  setEventFormTitleAtom,
} from "../../store/atoms/eventForm";

// 重复规则选项
const RECURRENCE_OPTIONS = [
  { value: "", label: "不重复" },
  { value: "FREQ=DAILY", label: "每天" },
  { value: "FREQ=WEEKLY", label: "每周" },
  { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "每个工作日" },
  { value: "FREQ=MONTHLY", label: "每月" },
  { value: "FREQ=YEARLY", label: "每年" },
];

export function EventModal() {
  // 状态（只读）
  const showModal = useAtomValue(showEventModalAtom);
  const editingEvent = useAtomValue(editingEventAtom);
  const calendars = useAtomValue(calendarsAtom);
  const isEditing = useAtomValue(isEditingEventAtom);
  const canSubmit = useAtomValue(canSubmitEventFormAtom);
  const formData = useAtomValue(getEventFormDataAtom);

  // 表单字段状态
  const title = useAtomValue(eventFormTitleAtom);
  const description = useAtomValue(eventFormDescriptionAtom);
  const startDate = useAtomValue(eventFormStartDateAtom);
  const startTime = useAtomValue(eventFormStartTimeAtom);
  const endDate = useAtomValue(eventFormEndDateAtom);
  const endTime = useAtomValue(eventFormEndTimeAtom);
  const isAllDay = useAtomValue(eventFormIsAllDayAtom);
  const location = useAtomValue(eventFormLocationAtom);
  const calendarId = useAtomValue(eventFormCalendarIdAtom);
  const recurrenceRule = useAtomValue(eventFormRecurrenceRuleAtom);

  // Action atoms
  const closeModal = useSetAtom(closeEventModalAtom);
  const createEvent = useSetAtom(createEventAtom);
  const updateEvent = useSetAtom(updateEventAtom);
  const deleteEvent = useSetAtom(deleteEventAtom);
  const initForm = useSetAtom(initEventFormAtom);

  // 表单字段 setters
  const setTitle = useSetAtom(setEventFormTitleAtom);
  const setDescription = useSetAtom(setEventFormDescriptionAtom);
  const setStartDate = useSetAtom(setEventFormStartDateAtom);
  const setStartTime = useSetAtom(setEventFormStartTimeAtom);
  const setEndDate = useSetAtom(setEventFormEndDateAtom);
  const setEndTime = useSetAtom(setEventFormEndTimeAtom);
  const setIsAllDay = useSetAtom(setEventFormIsAllDayAtom);
  const setLocation = useSetAtom(setEventFormLocationAtom);
  const setCalendarId = useSetAtom(setEventFormCalendarIdAtom);
  const setRecurrenceRule = useSetAtom(setEventFormRecurrenceRuleAtom);

  // Refs (允许用于 DOM 操作)
  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 初始化表单（当弹窗打开时）
  useEffect(() => {
    if (showModal) {
      initForm();
      // 聚焦标题输入框
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [showModal, initForm]);

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, closeModal]);

  // 点击外部关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    if (isEditing && editingEvent) {
      await updateEvent({
        id: editingEvent.id,
        ...formData,
      });
    } else {
      await createEvent(formData);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    if (confirm("确定要删除这个事件吗？")) {
      await deleteEvent(editingEvent.id);
    }
  };

  if (!showModal) return null;

  return (
    <div className="event-modal__backdrop" onClick={handleBackdropClick}>
      <div className="event-modal" ref={modalRef}>
        <header className="event-modal__header">
          <h2 className="event-modal__title">
            {isEditing ? "编辑事件" : "新建事件"}
          </h2>
          <button
            type="button"
            className="event-modal__close"
            onClick={closeModal}
            aria-label="关闭"
          >
            ×
          </button>
        </header>

        <form className="event-modal__form" onSubmit={handleSubmit}>
          {/* 标题 */}
          <div className="event-modal__field">
            <input
              ref={titleInputRef}
              type="text"
              className="event-modal__input event-modal__input--title"
              placeholder="添加标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              required
            />
          </div>

          {/* 时间 */}
          <div className="event-modal__field event-modal__field--row">
            <label className="event-modal__label">
              <span className="event-modal__icon">🕐</span>
              开始
            </label>
            <div className="event-modal__datetime">
              <input
                type="date"
                className="event-modal__input event-modal__input--date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onInput={(e) =>
                  setStartDate((e.target as HTMLInputElement).value)
                }
                required
              />
              {!isAllDay && (
                <input
                  type="time"
                  className="event-modal__input event-modal__input--time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  onInput={(e) =>
                    setStartTime((e.target as HTMLInputElement).value)
                  }
                  required
                />
              )}
            </div>
          </div>

          <div className="event-modal__field event-modal__field--row">
            <label className="event-modal__label">
              <span className="event-modal__icon">🕐</span>
              结束
            </label>
            <div className="event-modal__datetime">
              <input
                type="date"
                className="event-modal__input event-modal__input--date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onInput={(e) =>
                  setEndDate((e.target as HTMLInputElement).value)
                }
                required
              />
              {!isAllDay && (
                <input
                  type="time"
                  className="event-modal__input event-modal__input--time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  onInput={(e) =>
                    setEndTime((e.target as HTMLInputElement).value)
                  }
                  required
                />
              )}
            </div>
          </div>

          {/* 全天事件 */}
          <div className="event-modal__field event-modal__field--row">
            <label className="event-modal__checkbox-label">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
              />
              全天事件
            </label>
          </div>

          {/* 重复 */}
          <div className="event-modal__field event-modal__field--row">
            <label className="event-modal__label">
              <span className="event-modal__icon">↻</span>
              重复
            </label>
            <select
              className="event-modal__select"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 日历 */}
          <div className="event-modal__field event-modal__field--row">
            <label className="event-modal__label">
              <span className="event-modal__icon">📅</span>
              日历
            </label>
            <select
              className="event-modal__select"
              value={calendarId}
              onChange={(e) => setCalendarId(Number(e.target.value))}
              required
            >
              <option value="">选择日历</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>

          {/* 地点 */}
          <div className="event-modal__field">
            <label className="event-modal__label">
              <span className="event-modal__icon">📍</span>
              地点
            </label>
            <input
              type="text"
              className="event-modal__input"
              placeholder="添加地点"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onInput={(e) =>
                setLocation((e.target as HTMLInputElement).value)
              }
            />
          </div>

          {/* 描述 */}
          <div className="event-modal__field">
            <label className="event-modal__label">
              <span className="event-modal__icon">📝</span>
              描述
            </label>
            <textarea
              className="event-modal__textarea"
              placeholder="添加描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onInput={(e) =>
                setDescription((e.target as HTMLTextAreaElement).value)
              }
              rows={3}
            />
          </div>

          {/* 操作按钮 */}
          <div className="event-modal__actions">
            {isEditing && (
              <button
                type="button"
                className="event-modal__btn event-modal__btn--delete"
                onClick={handleDelete}
              >
                删除
              </button>
            )}
            <div className="event-modal__actions-right">
              <button
                type="button"
                className="event-modal__btn event-modal__btn--cancel"
                onClick={closeModal}
              >
                取消
              </button>
              <button
                type="submit"
                className="event-modal__btn event-modal__btn--save"
                disabled={!canSubmit}
              >
                {isEditing ? "保存" : "创建"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
