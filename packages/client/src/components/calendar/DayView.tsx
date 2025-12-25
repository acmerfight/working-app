import { useAtomValue, useSetAtom } from "jotai";
import {
  getEventsForDateAtom,
  openNewEventModalAtom,
  selectedDateAtom,
  dragUpdateEventAtom,
  type CalendarEvent,
} from "../../store/atoms/calendar";
import { EventItem } from "./EventItem";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView() {
  const selectedDate = useAtomValue(selectedDateAtom);
  const getEventsForDate = useAtomValue(getEventsForDateAtom);
  const openNewEventModal = useSetAtom(openNewEventModalAtom);
  const dragUpdateEvent = useSetAtom(dragUpdateEventAtom);

  const events = getEventsForDate(selectedDate);
  const allDayEvents = events.filter((e) => e.isAllDay);
  const timedEvents = events.filter((e) => !e.isAllDay);

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  const handleSlotClick = (hour: number) => {
    const startTime = new Date(selectedDate);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(selectedDate);
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

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    try {
      const eventData = JSON.parse(e.dataTransfer.getData("application/json")) as CalendarEvent;
      const originalStart = new Date(eventData.startTime);
      const originalEnd = new Date(eventData.endTime);
      const duration = originalEnd.getTime() - originalStart.getTime();

      const newStartTime = new Date(selectedDate);
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

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;

    return {
      top: `${startHour * 60}px`,
      height: `${Math.max(duration * 60, 30)}px`,
    };
  };

  const formatDateHeader = () => {
    const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
      selectedDate.getDay()
    ];
    return `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 ${weekday}`;
  };

  // 当前时间指示线
  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    return `${hours * 60}px`;
  };

  const currentTimePos = getCurrentTimePosition();

  return (
    <div className="day-view">
      {/* 日期头部 */}
      <div className="day-view__header">
        <div className="day-view__time-gutter" />
        <div
          className={`day-view__date-header ${
            isToday ? "day-view__date-header--today" : ""
          }`}
        >
          {formatDateHeader()}
        </div>
      </div>

      {/* 全天事件 */}
      {allDayEvents.length > 0 && (
        <div className="day-view__all-day">
          <div className="day-view__all-day-label">全天</div>
          <div className="day-view__all-day-events">
            {allDayEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* 时间网格 */}
      <div className="day-view__body">
        <div className="day-view__time-column">
          {HOURS.map((hour) => (
            <div key={hour} className="day-view__time-label">
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="day-view__grid">
          {/* 时间格子 */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="day-view__slot"
              onClick={() => handleSlotClick(hour)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, hour)}
            />
          ))}

          {/* 当前时间线 */}
          {currentTimePos && (
            <div
              className="day-view__current-time"
              style={{ top: currentTimePos }}
            >
              <div className="day-view__current-time-dot" />
              <div className="day-view__current-time-line" />
            </div>
          )}

          {/* 事件 */}
          <div className="day-view__events">
            {timedEvents.map((event) => (
              <div
                key={event.id}
                className="day-view__event"
                style={getEventPosition(event)}
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
      </div>
    </div>
  );
}

