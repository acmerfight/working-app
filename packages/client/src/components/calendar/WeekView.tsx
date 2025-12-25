import { useAtomValue, useSetAtom } from "jotai";
import {
  currentWeekDaysAtom,
  getEventsForDateAtom,
  openNewEventModalAtom,
  dragUpdateEventAtom,
  type CalendarEvent,
} from "../../store/atoms/calendar";
import { EventItem } from "./EventItem";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function WeekView() {
  const days = useAtomValue(currentWeekDaysAtom);
  const getEventsForDate = useAtomValue(getEventsForDateAtom);
  const openNewEventModal = useSetAtom(openNewEventModalAtom);
  const dragUpdateEvent = useSetAtom(dragUpdateEventAtom);

  const today = new Date();

  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString();

  const handleSlotClick = (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);
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

  const handleDrop = (e: React.DragEvent, targetDate: Date, hour: number) => {
    e.preventDefault();
    try {
      const eventData = JSON.parse(e.dataTransfer.getData("application/json")) as CalendarEvent;
      const originalStart = new Date(eventData.startTime);
      const originalEnd = new Date(eventData.endTime);
      const duration = originalEnd.getTime() - originalStart.getTime();

      const newStartTime = new Date(targetDate);
      newStartTime.setHours(hour, 0, 0, 0);
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

  const getEventPosition = (event: CalendarEvent, date: Date) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    // 如果是跨天事件，调整显示范围
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const displayStart = start < dayStart ? dayStart : start;
    const displayEnd = end > dayEnd ? dayEnd : end;

    const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
    const endHour = displayEnd.getHours() + displayEnd.getMinutes() / 60;
    const duration = endHour - startHour;

    return {
      top: `${startHour * 60}px`,
      height: `${Math.max(duration * 60, 20)}px`,
    };
  };

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="week-view">
      {/* 头部 - 日期 */}
      <div className="week-view__header">
        <div className="week-view__time-gutter" />
        {days.map((date, index) => (
          <div
            key={index}
            className={`week-view__day-header ${
              isToday(date) ? "week-view__day-header--today" : ""
            }`}
          >
            <span className="week-view__weekday">{WEEKDAYS[date.getDay()]}</span>
            <span
              className={`week-view__date ${
                isToday(date) ? "week-view__date--today" : ""
              }`}
            >
              {formatDate(date)}
            </span>
          </div>
        ))}
      </div>

      {/* 时间网格 */}
      <div className="week-view__body">
        <div className="week-view__time-column">
          {HOURS.map((hour) => (
            <div key={hour} className="week-view__time-label">
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="week-view__grid">
          {days.map((date, dayIndex) => {
            const events = getEventsForDate(date).filter((e) => !e.isAllDay);

            return (
              <div key={dayIndex} className="week-view__day-column">
                {/* 时间格子 */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="week-view__slot"
                    onClick={() => handleSlotClick(date, hour)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date, hour)}
                  />
                ))}
                
                {/* 事件 */}
                <div className="week-view__events">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="week-view__event"
                      style={getEventPosition(event, date)}
                    >
                      <EventItem
                        event={event}
                        draggable
                        onDragStart={handleDragStart}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

