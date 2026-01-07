import { useAtomValue, useSetAtom } from "jotai";
import type { CalendarEvent } from "../../store/atoms/calendar";
import {
  calendarColorsAtom,
  openEditEventModalAtom,
} from "../../store/atoms/calendar";

type EventItemProps = {
  event: CalendarEvent;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, event: CalendarEvent) => void;
};

export function EventItem({
  event,
  compact = false,
  draggable = false,
  onDragStart,
}: EventItemProps) {
  const colors = useAtomValue(calendarColorsAtom);
  const openEditModal = useSetAtom(openEditEventModalAtom);
  
  const color = colors[event.calendarId] ?? "#3b82f6";
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditModal(event);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, event);
    }
  };

  if (compact) {
    return (
      <div
        className="event-item event-item--compact"
        style={{ "--event-color": color } as React.CSSProperties}
        onClick={handleClick}
        draggable={draggable}
        onDragStart={handleDragStart}
      >
        <span className="event-item__dot" />
        <span className="event-item__title">{event.title}</span>
      </div>
    );
  }

  return (
    <div
      className="event-item"
      style={{ "--event-color": color } as React.CSSProperties}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div className="event-item__header">
        <span className="event-item__time">
          {event.isAllDay ? "全天" : formatTime(event.startTime)}
        </span>
        {event.recurrenceRule && <span className="event-item__recurring">↻</span>}
      </div>
      <div className="event-item__title">{event.title}</div>
      {event.location && (
        <div className="event-item__location">📍 {event.location}</div>
      )}
    </div>
  );
}

