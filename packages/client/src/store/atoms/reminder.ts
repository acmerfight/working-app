import { atom } from "jotai";
import { apiClient } from "../../lib/api-client";
import type { Reminder } from "./calendar";

// ============ State Atoms ============

// 待处理的提醒列表
export const pendingRemindersAtom = atom<Reminder[]>([]);

// 通知权限状态
export const notificationPermissionAtom = atom<NotificationPermission>("default");

// 是否启用提醒检查
export const reminderCheckEnabledAtom = atom(true);

// ============ Action Atoms ============

// 请求通知权限
export const requestNotificationPermissionAtom = atom(null, async (_get, set) => {
  if (!("Notification" in window)) {
    console.warn("浏览器不支持通知");
    return;
  }

  const permission = await Notification.requestPermission();
  set(notificationPermissionAtom, permission);
  return permission;
});

// 显示通知
export const showNotificationAtom = atom(
  null,
  async (_get, _set, params: { title: string; body: string; icon?: string }) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const notification = new Notification(params.title, {
      body: params.body,
      icon: params.icon ?? "/calendar-icon.png",
      badge: "/calendar-icon.png",
      tag: `reminder-${Date.now()}`,
      requireInteraction: true,
    });

    // 点击通知时聚焦窗口
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 5 秒后自动关闭
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
);

// 获取即将到期的提醒
export const fetchPendingRemindersAtom = atom(null, async (_get, set) => {
  try {
    const response = await apiClient.reminders.pending.$get({
      query: { minutes: "5" },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    
    const data = await response.json();
    set(pendingRemindersAtom, data.reminders as Reminder[]);
    return data.reminders as Reminder[];
  } catch (error) {
    console.error("获取提醒失败:", error);
    return [];
  }
});

// 标记提醒已发送
export const markReminderSentAtom = atom(null, async (get, set, reminderId: number) => {
  try {
    const response = await apiClient.reminders[":id"]["mark-sent"].$put({
      param: { id: String(reminderId) },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    
    // 从待处理列表移除
    const pendingReminders = get(pendingRemindersAtom);
    set(
      pendingRemindersAtom,
      pendingReminders.filter((r) => r.id !== reminderId)
    );
  } catch (error) {
    console.error("标记提醒失败:", error);
  }
});

// 处理并显示提醒通知
export const processRemindersAtom = atom(null, async (get, set) => {
  const permission = get(notificationPermissionAtom);
  
  if (permission !== "granted") {
    return;
  }
  
  // 获取待处理的提醒
  const reminders = await set(fetchPendingRemindersAtom);
  
  if (!reminders || reminders.length === 0) {
    return;
  }
  
  // 处理每个提醒
  for (const reminder of reminders) {
    // 检查提醒时间是否已到
    const reminderTime = new Date(reminder.reminderTime);
    const now = new Date();
    
    if (reminderTime <= now) {
      // 获取事件信息（简化版，实际应该从事件列表获取）
      await set(showNotificationAtom, {
        title: "📅 日历提醒",
        body: `您有一个即将开始的事件`,
      });
      
      // 标记为已发送
      await set(markReminderSentAtom, reminder.id);
    }
  }
});

// 创建事件提醒
export const createEventReminderAtom = atom(
  null,
  async (_get, _set, params: { eventId: number; minutesBefore: number }) => {
    // 计算提醒时间（需要从事件获取开始时间）
    // 这里简化处理，实际应该先获取事件信息
    try {
      const response = await apiClient.reminders.$post({
        json: {
          eventId: params.eventId,
          reminderTime: new Date(Date.now() + params.minutesBefore * 60 * 1000),
          type: "notification" as const,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("创建提醒失败:", error);
      throw error;
    }
  }
);

