/**
 * 黄历面板组件
 * 显示选中日期的详细黄历信息
 * 
 * ✅ 遵循渲染状态分离：
 * - 所有状态都来自 atoms（useAtomValue）
 * - 组件只负责纯渲染
 */
import { useAtomValue } from "jotai";
import { selectedDateAtom } from "../../store/atoms/calendar";
import { selectedDateLunarInfoAtom } from "../../store/atoms/lunar";

export function LunarPanel() {
  const selectedDate = useAtomValue(selectedDateAtom);
  const lunarInfo = useAtomValue(selectedDateLunarInfoAtom);

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  return (
    <div className="lunar-panel">
      {/* 日期头部 */}
      <div className="lunar-panel__header">
        <div className="lunar-panel__date-solar">
          {formatDate(selectedDate)} {weekDays[selectedDate.getDay()]}
        </div>
        <div className="lunar-panel__date-lunar">
          {lunarInfo.lunarYearName}年 {lunarInfo.lunarMonthName}
          {lunarInfo.lunarDayName}
        </div>
        <div className="lunar-panel__ganzhi">
          {lunarInfo.yearGanZhi}年 {lunarInfo.monthGanZhi}月 {lunarInfo.dayGanZhi}日
        </div>
        <div className="lunar-panel__shengxiao">
          【{lunarInfo.yearShengXiao}】年 {lunarInfo.xingZuo}座
        </div>
      </div>

      {/* 节气节日 */}
      {(lunarInfo.jieQi ||
        lunarInfo.festivals.length > 0 ||
        lunarInfo.lunarFestivals.length > 0) && (
        <div className="lunar-panel__section">
          <div className="lunar-panel__section-title">📅 节气节日</div>
          <div className="lunar-panel__tags">
            {lunarInfo.jieQi && (
              <span className="lunar-panel__tag lunar-panel__tag--jieqi">
                {lunarInfo.jieQi}
              </span>
            )}
            {lunarInfo.lunarFestivals.map((f) => (
              <span key={f} className="lunar-panel__tag lunar-panel__tag--lunar">
                {f}
              </span>
            ))}
            {lunarInfo.festivals.map((f) => (
              <span key={f} className="lunar-panel__tag lunar-panel__tag--solar">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 法定假日 */}
      {lunarInfo.holiday && (
        <div className="lunar-panel__section">
          <div className="lunar-panel__section-title">🏖️ 法定假日</div>
          <div className="lunar-panel__holiday">
            <span className={`lunar-panel__holiday-badge ${lunarInfo.holiday.isWork ? "lunar-panel__holiday-badge--work" : ""}`}>
              {lunarInfo.holiday.isWork ? "调休上班" : "放假"}
            </span>
            <span>{lunarInfo.holiday.name}</span>
          </div>
        </div>
      )}

      {/* 宜忌 */}
      <div className="lunar-panel__section">
        <div className="lunar-panel__section-title">📜 每日宜忌</div>
        <div className="lunar-panel__yiji">
          <div className="lunar-panel__yi">
            <span className="lunar-panel__yi-label">宜</span>
            <span className="lunar-panel__yi-content">
              {lunarInfo.yi.slice(0, 6).join(" · ") || "无"}
            </span>
          </div>
          <div className="lunar-panel__ji">
            <span className="lunar-panel__ji-label">忌</span>
            <span className="lunar-panel__ji-content">
              {lunarInfo.ji.slice(0, 6).join(" · ") || "无"}
            </span>
          </div>
        </div>
      </div>

      {/* 吉神方位 */}
      <div className="lunar-panel__section">
        <div className="lunar-panel__section-title">🧭 吉神方位</div>
        <div className="lunar-panel__positions">
          <div className="lunar-panel__position">
            <span className="lunar-panel__position-icon">喜</span>
            <span className="lunar-panel__position-name">喜神</span>
            <span className="lunar-panel__position-value">{lunarInfo.xiShen}</span>
          </div>
          <div className="lunar-panel__position">
            <span className="lunar-panel__position-icon">福</span>
            <span className="lunar-panel__position-name">福神</span>
            <span className="lunar-panel__position-value">{lunarInfo.fuShen}</span>
          </div>
          <div className="lunar-panel__position">
            <span className="lunar-panel__position-icon">财</span>
            <span className="lunar-panel__position-name">财神</span>
            <span className="lunar-panel__position-value">{lunarInfo.caiShen}</span>
          </div>
        </div>
      </div>

      {/* 冲煞 */}
      <div className="lunar-panel__section">
        <div className="lunar-panel__section-title">⚠️ 冲煞</div>
        <div className="lunar-panel__chongsha">
          <span>冲{lunarInfo.chong}</span>
          <span>煞{lunarInfo.sha}</span>
        </div>
      </div>

      {/* 其他信息 */}
      <div className="lunar-panel__section">
        <div className="lunar-panel__section-title">📖 其他</div>
        <div className="lunar-panel__others">
          <div className="lunar-panel__other-item">
            <span className="lunar-panel__other-label">星宿</span>
            <span className="lunar-panel__other-value">
              {lunarInfo.xiu} ({lunarInfo.xiuLuck})
            </span>
          </div>
          <div className="lunar-panel__other-item">
            <span className="lunar-panel__other-label">值神</span>
            <span className="lunar-panel__other-value">
              {lunarInfo.zhiRi}
              {lunarInfo.isHuangDaoJiRi && (
                <span className="lunar-panel__huangdao">黄道吉日</span>
              )}
            </span>
          </div>
          <div className="lunar-panel__other-item">
            <span className="lunar-panel__other-label">纳音</span>
            <span className="lunar-panel__other-value">{lunarInfo.naYin}</span>
          </div>
          <div className="lunar-panel__other-item">
            <span className="lunar-panel__other-label">彭祖百忌</span>
            <span className="lunar-panel__other-value lunar-panel__other-value--small">
              {lunarInfo.pengZu}
            </span>
          </div>
        </div>
      </div>

      {/* 下一个节气 */}
      {lunarInfo.nextJieQi && (
        <div className="lunar-panel__next-jieqi">
          <span>距离【{lunarInfo.nextJieQi.name}】还有 </span>
          <span className="lunar-panel__next-jieqi-date">
            {getDaysUntil(lunarInfo.nextJieQi.date)}
          </span>
          <span> 天</span>
        </div>
      )}
    </div>
  );
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
