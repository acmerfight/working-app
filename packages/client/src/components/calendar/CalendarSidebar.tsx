/**
 * 日历侧边栏组件
 * 显示小月历、黄历和日历列表
 * 
 * ✅ 遵循渲染状态分离：
 * - 所有状态都来自 atoms（useAtomValue）
 * - 所有操作都通过 action atoms（useSetAtom）
 * - 组件只负责纯渲染
 */
import { useAtomValue, useSetAtom } from "jotai";
import {
  calendarsAtom,
  createCalendarAtom,
  deleteCalendarAtom,
  selectedCalendarIdsAtom,
  toggleCalendarSelectionAtom,
} from "../../store/atoms/calendar";
import {
  showLunarPanelAtom,
  toggleLunarPanelAtom,
} from "../../store/atoms/lunar";
import {
  isCreatingCalendarAtom,
  newCalendarNameAtom,
  newCalendarColorAtom,
  startCreatingCalendarAtom,
  cancelCreatingCalendarAtom,
  setNewCalendarNameAtom,
  setNewCalendarColorAtom,
} from "../../store/atoms/sidebar";
import { LunarPanel } from "./LunarPanel";
import { MiniCalendar } from "./MiniCalendar";

// 预设颜色
const PRESET_COLORS = [
  "#ef4444", // 红色
  "#f97316", // 橙色
  "#eab308", // 黄色
  "#22c55e", // 绿色
  "#14b8a6", // 青色
  "#3b82f6", // 蓝色
  "#8b5cf6", // 紫色
  "#ec4899", // 粉色
];

export function CalendarSidebar() {
  // 只读状态
  const calendars = useAtomValue(calendarsAtom);
  const selectedIds = useAtomValue(selectedCalendarIdsAtom);
  const showLunar = useAtomValue(showLunarPanelAtom);
  const isCreating = useAtomValue(isCreatingCalendarAtom);
  const newCalendarName = useAtomValue(newCalendarNameAtom);
  const newCalendarColor = useAtomValue(newCalendarColorAtom);

  // Actions
  const toggleSelection = useSetAtom(toggleCalendarSelectionAtom);
  const createCalendar = useSetAtom(createCalendarAtom);
  const deleteCalendar = useSetAtom(deleteCalendarAtom);
  const toggleLunar = useSetAtom(toggleLunarPanelAtom);
  const startCreating = useSetAtom(startCreatingCalendarAtom);
  const cancelCreating = useSetAtom(cancelCreatingCalendarAtom);
  const setNewName = useSetAtom(setNewCalendarNameAtom);
  const setNewColor = useSetAtom(setNewCalendarColorAtom);

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) return;
    
    await createCalendar({
      name: newCalendarName.trim(),
      color: newCalendarColor,
    });
    
    cancelCreating();
  };

  const handleDeleteCalendar = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("确定要删除这个日历吗？相关的所有事件也会被删除。")) {
      await deleteCalendar(id);
    }
  };

  return (
    <aside className="calendar-sidebar">
      <MiniCalendar />
      
      {/* 黄历面板 */}
      <div className="calendar-sidebar__section">
        <div className="calendar-sidebar__section-header">
          <h3 className="calendar-sidebar__section-title">📿 黄历</h3>
          <button
            type="button"
            className="calendar-sidebar__toggle-btn"
            onClick={toggleLunar}
            aria-label={showLunar ? "收起黄历" : "展开黄历"}
          >
            {showLunar ? "▼" : "▶"}
          </button>
        </div>
        {showLunar && <LunarPanel />}
      </div>
      
      <div className="calendar-sidebar__section">
        <div className="calendar-sidebar__section-header">
          <h3 className="calendar-sidebar__section-title">我的日历</h3>
          <button
            type="button"
            className="calendar-sidebar__add-btn"
            onClick={startCreating}
            aria-label="添加日历"
          >
            +
          </button>
        </div>
        
        {isCreating && (
          <div className="calendar-sidebar__create-form">
            <input
              type="text"
              className="calendar-sidebar__input"
              placeholder="日历名称"
              value={newCalendarName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateCalendar();
                if (e.key === "Escape") cancelCreating();
              }}
              autoFocus
            />
            <div className="calendar-sidebar__color-picker">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`calendar-sidebar__color-btn ${
                    newCalendarColor === color
                      ? "calendar-sidebar__color-btn--active"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewColor(color)}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
            </div>
            <div className="calendar-sidebar__form-actions">
              <button
                type="button"
                className="calendar-sidebar__cancel-btn"
                onClick={cancelCreating}
              >
                取消
              </button>
              <button
                type="button"
                className="calendar-sidebar__save-btn"
                onClick={handleCreateCalendar}
                disabled={!newCalendarName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        )}
        
        <ul className="calendar-sidebar__list">
          {calendars.map((calendar) => (
            <li key={calendar.id} className="calendar-sidebar__item">
              <label className="calendar-sidebar__label">
                <input
                  type="checkbox"
                  className="calendar-sidebar__checkbox"
                  checked={selectedIds.includes(calendar.id)}
                  onChange={() => toggleSelection(calendar.id)}
                  style={
                    {
                      "--checkbox-color": calendar.color,
                    } as React.CSSProperties
                  }
                />
                <span
                  className="calendar-sidebar__color-dot"
                  style={{ backgroundColor: calendar.color }}
                />
                <span className="calendar-sidebar__name">{calendar.name}</span>
              </label>
              <button
                type="button"
                className="calendar-sidebar__delete-btn"
                onClick={(e) => handleDeleteCalendar(e, calendar.id)}
                aria-label="删除日历"
              >
                ×
              </button>
            </li>
          ))}
          
          {calendars.length === 0 && !isCreating && (
            <li className="calendar-sidebar__empty">
              暂无日历，点击 + 创建
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
