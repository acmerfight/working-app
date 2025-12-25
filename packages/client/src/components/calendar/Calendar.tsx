import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  calendarErrorAtom,
  calendarLoadingAtom,
  fetchCalendarsAtom,
  fetchEventsAtom,
  viewModeAtom,
} from "../../store/atoms/calendar";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarSidebar } from "./CalendarSidebar";
import { DayView } from "./DayView";
import { EventModal } from "./EventModal";
import { MonthView } from "./MonthView";
import { NotificationManager } from "./NotificationManager";
import { WeekView } from "./WeekView";

export function Calendar() {
  const viewMode = useAtomValue(viewModeAtom);
  const loading = useAtomValue(calendarLoadingAtom);
  const error = useAtomValue(calendarErrorAtom);
  
  const fetchCalendars = useSetAtom(fetchCalendarsAtom);
  const fetchEvents = useSetAtom(fetchEventsAtom);

  // 初始化加载
  useEffect(() => {
    const loadData = async () => {
      await fetchCalendars();
      await fetchEvents();
    };
    loadData();
  }, [fetchCalendars, fetchEvents]);

  const renderView = () => {
    switch (viewMode) {
      case "month":
        return <MonthView />;
      case "week":
        return <WeekView />;
      case "day":
        return <DayView />;
      default:
        return <MonthView />;
    }
  };

  return (
    <div className="calendar">
      <CalendarSidebar />
      
      <div className="calendar__main">
        <CalendarHeader />
        
        {error && (
          <div className="calendar__error">
            <span className="calendar__error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <div className="calendar__content">
          {loading ? (
            <div className="calendar__loading">
              <div className="calendar__spinner" />
              <span>加载中...</span>
            </div>
          ) : (
            renderView()
          )}
        </div>
      </div>
      
      <EventModal />
      <NotificationManager />
    </div>
  );
}

