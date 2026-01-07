/**
 * 中国黄历工具
 * 基于 lunar-typescript 库
 * @see https://github.com/6tail/lunar-typescript
 */
import { Solar, HolidayUtil } from "lunar-typescript";

// 黄历信息类型
export type LunarInfo = {
  // 基础农历信息
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarMonthName: string; // 正月、二月...
  lunarDayName: string; // 初一、初二...
  lunarYearName: string; // 二〇二五
  isLeapMonth: boolean; // 是否闰月

  // 干支
  yearGanZhi: string; // 年干支 如：乙巳
  monthGanZhi: string; // 月干支
  dayGanZhi: string; // 日干支
  yearShengXiao: string; // 年生肖 如：蛇

  // 节气
  jieQi: string | null; // 当天节气（如果有）
  nextJieQi: {
    name: string;
    date: string;
  } | null;

  // 星座
  xingZuo: string;

  // 节日
  festivals: string[]; // 公历节日
  lunarFestivals: string[]; // 农历节日
  otherFestivals: string[]; // 其他节日

  // 法定假日
  holiday: {
    name: string;
    isWork: boolean; // true=调休上班，false=放假
  } | null;

  // 宜忌
  yi: string[]; // 宜
  ji: string[]; // 忌

  // 吉神方位
  xiShen: string; // 喜神方位
  fuShen: string; // 福神方位
  caiShen: string; // 财神方位

  // 冲煞
  chong: string; // 冲什么
  sha: string; // 煞方位

  // 星宿
  xiu: string; // 星宿名
  xiuLuck: string; // 星宿吉凶

  // 彭祖百忌
  pengZu: string;

  // 纳音
  naYin: string;

  // 值日神煞（青龙、明堂等十二神）
  zhiRi: string;

  // 是否黄道吉日
  isHuangDaoJiRi: boolean;
};

/**
 * 获取指定日期的黄历信息
 */
export function getLunarInfo(date: Date): LunarInfo {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();

  // 获取节气
  const jieQi = lunar.getJieQi();
  const nextJq = lunar.getNextJieQi();

  // 获取节日
  const festivals = solar.getFestivals();
  const lunarFestivals = lunar.getFestivals();
  const otherFestivals = solar.getOtherFestivals();

  // 获取法定假日
  const holiday = HolidayUtil.getHoliday(
    solar.getYear(),
    solar.getMonth(),
    solar.getDay()
  );

  // 获取宜忌
  const dayYi = lunar.getDayYi();
  const dayJi = lunar.getDayJi();

  // 获取吉神方位
  const dayPositionXi = lunar.getDayPositionXiDesc();
  const dayPositionFu = lunar.getDayPositionFuDesc();
  const dayPositionCai = lunar.getDayPositionCaiDesc();

  // 获取冲煞
  const chong = lunar.getDayChongDesc();
  const sha = lunar.getDaySha();

  // 获取星宿
  const xiu = lunar.getXiu();
  const xiuLuck = lunar.getXiuLuck();

  // 获取彭祖百忌
  const pengZu = lunar.getPengZuGan() + " " + lunar.getPengZuZhi();

  // 获取纳音
  const naYin = lunar.getDayNaYin();

  // 获取值日神（十二神）
  const zhiRi = lunar.getZhiXing();

  // 判断是否黄道吉日
  // 青龙、明堂、金匮、天德、玉堂、司命为黄道日（六黄道）
  const huangDaoList = ["青龙", "明堂", "金匮", "天德", "玉堂", "司命"];
  const isHuangDaoJiRi = huangDaoList.includes(zhiRi);

  return {
    lunarYear: lunar.getYear(),
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    lunarMonthName: lunar.getMonthInChinese() + "月",
    lunarDayName: lunar.getDayInChinese(),
    lunarYearName: lunar.getYearInChinese(),
    isLeapMonth: lunar.getMonth() < 0,

    yearGanZhi: lunar.getYearInGanZhi(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    yearShengXiao: lunar.getYearShengXiao(),

    jieQi: jieQi || null,
    nextJieQi: nextJq
      ? {
          name: nextJq.getName(),
          date: nextJq.getSolar().toYmd(),
        }
      : null,

    xingZuo: solar.getXingZuo(),

    festivals,
    lunarFestivals,
    otherFestivals,

    holiday: holiday
      ? {
          name: holiday.getName(),
          isWork: holiday.isWork(),
        }
      : null,

    yi: dayYi,
    ji: dayJi,

    xiShen: dayPositionXi,
    fuShen: dayPositionFu,
    caiShen: dayPositionCai,

    chong,
    sha,

    xiu: xiu + "宿",
    xiuLuck,

    pengZu,
    naYin,
    zhiRi,

    isHuangDaoJiRi,
  };
}

/**
 * 获取简化的农历信息（用于日历格子显示）
 */
export function getSimpleLunarInfo(date: Date): {
  lunarDayName: string;
  lunarMonthName: string;
  isFirstDay: boolean; // 是否初一
  jieQi: string | null;
  festival: string | null;
  isHoliday: boolean;
  isWorkDay: boolean; // 调休工作日
} {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();

  const isFirstDay = lunar.getDay() === 1;
  const jieQi = lunar.getJieQi();

  // 获取节日（优先级：农历节日 > 公历节日）
  const lunarFestivals = lunar.getFestivals();
  const solarFestivals = solar.getFestivals();
  const festival = lunarFestivals[0] || solarFestivals[0] || null;

  // 法定假日
  const holiday = HolidayUtil.getHoliday(
    solar.getYear(),
    solar.getMonth(),
    solar.getDay()
  );

  return {
    lunarDayName: lunar.getDayInChinese(),
    lunarMonthName: lunar.getMonthInChinese() + "月",
    isFirstDay,
    jieQi,
    festival,
    isHoliday: holiday ? !holiday.isWork() : false,
    isWorkDay: holiday ? holiday.isWork() : false,
  };
}

/**
 * 获取指定年份的所有节气
 */
export function getJieQiList(
  year: number
): Array<{ name: string; date: string }> {
  const solar = Solar.fromYmd(year, 1, 1);
  const lunar = solar.getLunar();
  const jieQiTable = lunar.getJieQiTable() as Record<string, { getYear: () => number; toYmd: () => string }>;

  const result: Array<{ name: string; date: string }> = [];

  Object.entries(jieQiTable).forEach(([name, solarDate]) => {
    if (solarDate && solarDate.getYear() === year) {
      result.push({
        name,
        date: solarDate.toYmd(),
      });
    }
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 判断是否是周末
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * 获取中国传统节日列表
 */
export const CHINESE_FESTIVALS = [
  { name: "春节", lunar: "正月初一" },
  { name: "元宵节", lunar: "正月十五" },
  { name: "龙抬头", lunar: "二月初二" },
  { name: "清明节", jieQi: "清明" },
  { name: "端午节", lunar: "五月初五" },
  { name: "七夕节", lunar: "七月初七" },
  { name: "中元节", lunar: "七月十五" },
  { name: "中秋节", lunar: "八月十五" },
  { name: "重阳节", lunar: "九月初九" },
  { name: "寒衣节", lunar: "十月初一" },
  { name: "下元节", lunar: "十月十五" },
  { name: "腊八节", lunar: "腊月初八" },
  { name: "小年", lunar: "腊月廿三" },
  { name: "除夕", lunar: "腊月三十" },
];

