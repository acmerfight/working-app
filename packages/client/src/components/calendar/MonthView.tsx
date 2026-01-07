/**
 * 月视图组件
 * 显示月历格子和事件
 * 
 * ✅ 遵循渲染状态分离：
 * - 所有状态和派生计算都来自 atoms
 * - 组件只负责纯渲染
 * - 事件处理通过 action atoms
 */
import { useAtomValue, useSetAtom } from "jotai";
import {
  currentMonthDaysAtom,
  getEventsForDateAtom,
  openNewEventModalAtom,
  selectedDateAtom,
  dragUpdateEventAtom,
  type CalendarEvent,
} from "../../store/atoms/calendar";
import { monthLunarInfoMapAtom } from "../../store/atoms/lunar";
import { EventItem } from "./EventItem";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function MonthView() {
  // 只读状态（从 atoms 获取）
  const days = useAtomValue(currentMonthDaysAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const getEventsForDate = useAtomValue(getEventsForDateAtom);
  const lunarInfoMap = useAtomValue(monthLunarInfoMapAtom);
  
  // Action atoms（稳定引用，无需 useCallback）
  const openNewEventModal = useSetAtom(openNewEventModalAtom);
  const dragUpdateEvent = useSetAtom(dragUpdateEventAtom);

  const today = new Date();
  const currentMonth = selectedDate.getMonth();

  const handleDayClick = (date: Date) => {
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(10, 0, 0, 0);
    openNewEventModal({ startTime, endTime });
  };

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(event));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    try {
      const eventData = JSON.parse(e.dataTransfer.getData("application/json")) as CalendarEvent;
      const originalStart = new Date(eventData.startTime);
      const originalEnd = new Date(eventData.endTime);
      const duration = originalEnd.getTime() - originalStart.getTime();

      // 保持原来的时间，只更新日期
      const newStartTime = new Date(targetDate);
      newStartTime.setHours(
        originalStart.getHours(),
        originalStart.getMinutes(),
        0,
        0
      );
      const newEndTime = new Date(newStartTime.getTime() + duration);

      dragUpdateEvent({
        eventId: eventData.id,
        newStartTime,
        newEndTime,
      });
    } catch {
      // 忽略解析错误
    }
  };

  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString();

  const isCurrentMonth = (date: Date) =>
    date.getMonth() === currentMonth;

  const getLunarDisplay = (date: Date) => {
    const lunar = lunarInfoMap.get(date.toDateString());
    if (!lunar) return "";
    
    // 优先级：节日 > 节气 > 初一（显示月份） > 农历日
    if (lunar.festival) return lunar.festival;
    if (lunar.jieQi) return lunar.jieQi;
    if (lunar.isFirstDay) return lunar.lunarMonthName;
    return lunar.lunarDayName;
  };

  const getLunarClass = (date: Date) => {
    const lunar = lunarInfoMap.get(date.toDateString());
    if (!lunar) return "";
    
    if (lunar.festival || lunar.lunarMonthName.includes("节")) return "month-view__lunar--festival";
    if (lunar.jieQi) return "month-view__lunar--jieqi";
    if (lunar.isFirstDay) return "month-view__lunar--first";
    return "";
  };

  const getHolidayBadge = (date: Date) => {
    const lunar = lunarInfoMap.get(date.toDateString());
    if (!lunar) return null;
    
    if (lunar.isHoliday) return <span className="month-view__badge month-view__badge--holiday">休</span>;
    if (lunar.isWorkDay) return <span className="month-view__badge month-view__badge--work">班</span>;
    return null;
  };

  return (
    <div className="month-view">
      <div className="month-view__weekdays">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`month-view__weekday ${
              index === 0 || index === 6 ? "month-view__weekday--weekend" : ""
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="month-view__grid">
        {days.map((date, index) => {
          const events = getEventsForDate(date);
          const displayEvents = events.slice(0, 2);
          const moreCount = events.length - 2;

          return (
            <div
              key={index}
              className={`month-view__day ${
                !isCurrentMonth(date) ? "month-view__day--other-month" : ""
              } ${isToday(date) ? "month-view__day--today" : ""}`}
              onClick={() => handleDayClick(date)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, date)}
            >
              <div className="month-view__day-header">
                <div
                  className={`month-view__date ${
                    isToday(date) ? "month-view__date--today" : ""
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className={`month-view__lunar ${getLunarClass(date)}`}>
                  {getLunarDisplay(date)}
                </div>
                {getHolidayBadge(date)}
              </div>
              <div className="month-view__events">
                {displayEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    compact
                    draggable
                    onDragStart={handleDragStart}
                  />
                ))}
                {moreCount > 0 && (
                  <div className="month-view__more">还有 {moreCount} 项</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
