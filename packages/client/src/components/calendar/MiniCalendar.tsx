/**
 * 迷你日历组件
 *
 * ✅ 遵循渲染状态分离：
 * - 所有状态都来自 atoms
 * - 所有操作都通过 action atoms
 * - 组件只负责 UI 渲染
 */
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { selectedDateAtom } from "../../store/atoms/calendar";
import {
  goToNextMiniMonthAtom,
  goToPrevMiniMonthAtom,
  initMiniCalendarAtom,
  miniCalendarDaysAtom,
  miniCalendarMonthAtom,
  miniCalendarYearAtom,
} from "../../store/atoms/miniCalendar";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function MiniCalendar() {
  // 状态（只读）
  const selectedDate = useAtomValue(selectedDateAtom);
  const days = useAtomValue(miniCalendarDaysAtom);
  const year = useAtomValue(miniCalendarYearAtom);
  const month = useAtomValue(miniCalendarMonthAtom);

  // Actions
  const setSelectedDate = useSetAtom(selectedDateAtom);
  const goToPrevMonth = useSetAtom(goToPrevMiniMonthAtom);
  const goToNextMonth = useSetAtom(goToNextMiniMonthAtom);
  const initMiniCalendar = useSetAtom(initMiniCalendarAtom);

  // 初始化（组件挂载时同步显示月份）
  useEffect(() => {
    initMiniCalendar();
  }, [initMiniCalendar]);

  const today = new Date();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  const isSelected = (date: Date) =>
    date.toDateString() === selectedDate.toDateString();

  return (
    <div className="mini-calendar">
      <div className="mini-calendar__header">
        <button
          className="mini-calendar__nav"
          onClick={goToPrevMonth}
          type="button"
          aria-label="上个月"
        >
          ‹
        </button>
        <span className="mini-calendar__title">
          {year}年{month}月
        </span>
        <button
          className="mini-calendar__nav"
          onClick={goToNextMonth}
          type="button"
          aria-label="下个月"
        >
          ›
        </button>
      </div>

      <div className="mini-calendar__weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="mini-calendar__weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="mini-calendar__grid">
        {days.map((date, index) => (
          <div key={index} className="mini-calendar__cell">
            {date && (
              <button
                type="button"
                className={`mini-calendar__day ${
                  isToday(date) ? "mini-calendar__day--today" : ""
                } ${isSelected(date) ? "mini-calendar__day--selected" : ""}`}
                onClick={() => handleDateClick(date)}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
