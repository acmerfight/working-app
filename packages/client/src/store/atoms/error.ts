import { atom } from "jotai";

// ============ Error State Atoms ============

/**
 * 全局错误信息
 * 用于记录应用中发生的错误
 */
export type AppError = {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  id: string;
};

/**
 * 最近一次的渲染错误
 */
export const renderErrorAtom = atom<AppError | null>(null);

/**
 * 错误历史记录（用于调试/上报）
 */
export const errorHistoryAtom = atom<AppError[]>([]);

/**
 * 是否处于错误恢复中
 */
export const isRecoveringAtom = atom(false);

// ============ Derived Atoms ============

/**
 * 是否有活跃的渲染错误
 */
export const hasRenderErrorAtom = atom((get) => get(renderErrorAtom) !== null);

// ============ Action Atoms ============

/**
 * 记录错误
 */
export const logErrorAtom = atom(
  null,
  (
    get,
    set,
    error: Error,
    errorInfo?: { componentStack?: string | null }
  ) => {
    const appError: AppError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      message: error.message,
      timestamp: Date.now(),
      ...(error.stack ? { stack: error.stack } : {}),
      ...(errorInfo?.componentStack ? { componentStack: errorInfo.componentStack } : {}),
    };

    // 设置当前错误
    set(renderErrorAtom, appError);

    // 添加到历史记录（保留最近 10 条）
    const history = get(errorHistoryAtom);
    set(errorHistoryAtom, [appError, ...history].slice(0, 10));

    // 开发环境下打印错误
    if (import.meta.env?.DEV) {
      console.group("🚨 ErrorBoundary caught an error");
      console.error("Error:", error);
      if (errorInfo?.componentStack) {
        console.error("Component Stack:", errorInfo.componentStack);
      }
      console.groupEnd();
    }

    // 生产环境可以在这里添加错误上报逻辑
    // reportErrorToService(appError);
  }
);

/**
 * 清除错误并尝试恢复
 */
export const recoverFromErrorAtom = atom(null, async (_get, set) => {
  set(isRecoveringAtom, true);

  // 短暂延迟，让 UI 有时间响应
  await new Promise((resolve) => setTimeout(resolve, 100));

  set(renderErrorAtom, null);
  set(isRecoveringAtom, false);
});

/**
 * 清除所有错误历史
 */
export const clearErrorHistoryAtom = atom(null, (_get, set) => {
  set(errorHistoryAtom, []);
  set(renderErrorAtom, null);
});

