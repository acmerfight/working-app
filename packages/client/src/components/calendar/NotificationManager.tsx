import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  notificationPermissionAtom,
  processRemindersAtom,
  reminderCheckEnabledAtom,
  requestNotificationPermissionAtom,
} from "../../store/atoms/reminder";

// 提醒检查间隔（毫秒）
const CHECK_INTERVAL = 60 * 1000; // 1分钟

export function NotificationManager() {
  const permission = useAtomValue(notificationPermissionAtom);
  const isEnabled = useAtomValue(reminderCheckEnabledAtom);
  const requestPermission = useSetAtom(requestNotificationPermissionAtom);
  const processReminders = useSetAtom(processRemindersAtom);

  // 初始化时检查并请求权限
  useEffect(() => {
    if ("Notification" in window && permission === "default") {
      // 只在用户交互后请求权限（浏览器策略）
      // 这里我们先保持默认状态，让用户主动请求
    }
  }, [permission]);

  // 定期检查提醒
  useEffect(() => {
    if (!isEnabled || permission !== "granted") {
      return;
    }

    // 立即检查一次
    processReminders();

    // 定时检查
    const intervalId = setInterval(() => {
      processReminders();
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isEnabled, permission, processReminders]);

  // 如果权限未授权，显示提示按钮
  if (permission !== "granted" && "Notification" in window) {
    return (
      <button
        type="button"
        className="notification-prompt"
        onClick={requestPermission}
        title="启用提醒通知"
      >
        🔔
      </button>
    );
  }

  // 已授权，不显示任何内容
  return null;
}

