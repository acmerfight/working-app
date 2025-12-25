import { useAtomValue, useSetAtom } from "jotai";
import {
  goToNextPeriodAtom,
  goToPrevPeriodAtom,
  goToTodayAtom,
  openNewEventModalAtom,
  selectedDateAtom,
  viewModeAtom,
  type ViewMode,
} from "../../store/atoms/calendar";
import { UserMenu } from "../auth";

export function CalendarHeader() {
  const selectedDate = useAtomValue(selectedDateAtom);
  const viewMode = useAtomValue(viewModeAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const goToPrev = useSetAtom(goToPrevPeriodAtom);
  const goToNext = useSetAtom(goToNextPeriodAtom);
  const goToToday = useSetAtom(goToTodayAtom);
  const openNewEventModal = useSetAtom(openNewEventModalAtom);

  const formatTitle = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    switch (viewMode) {
      case "month":
        return `${year}年${month}月`;
      case "week": {
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${year}年${month}月 第${Math.ceil(weekStart.getDate() / 7)}周`;
        }
        return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
      }
      case "day":
        return `${year}年${month}月${selectedDate.getDate()}日`;
    }
  };

  const viewModeOptions: { value: ViewMode; label: string }[] = [
    { value: "month", label: "月" },
    { value: "week", label: "周" },
    { value: "day", label: "日" },
  ];

  const handleNewEvent = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(now.getHours() + 1);
    openNewEventModal({ startTime: now, endTime });
  };

  return (
    <header className="calendar-header">
      <div className="calendar-header__left">
        <button
          className="calendar-header__new-btn"
          onClick={handleNewEvent}
          type="button"
        >
          <span className="calendar-header__plus">+</span>
          创建
        </button>
      </div>

      <div className="calendar-header__center">
        <button
          className="calendar-header__nav-btn"
          onClick={goToPrev}
          type="button"
          aria-label="上一个"
        >
          ‹
        </button>
        <button
          className="calendar-header__today-btn"
          onClick={goToToday}
          type="button"
        >
          今天
        </button>
        <button
          className="calendar-header__nav-btn"
          onClick={goToNext}
          type="button"
          aria-label="下一个"
        >
          ›
        </button>
        <h2 className="calendar-header__title">{formatTitle()}</h2>
      </div>

      <div className="calendar-header__right">
        <div className="calendar-header__view-switcher">
          {viewModeOptions.map((option) => (
            <button
              key={option.value}
              className={`calendar-header__view-btn ${
                viewMode === option.value ? "calendar-header__view-btn--active" : ""
              }`}
              onClick={() => setViewMode(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <UserMenu />
      </div>
    </header>
  );
}

