import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import {
  logErrorAtom,
  recoverFromErrorAtom,
  renderErrorAtom,
  isRecoveringAtom,
  type AppError,
} from "../store/atoms/error";

// ============ Types ============

type ErrorBoundaryProps = {
  children: ReactNode;
  /**
   * 自定义 fallback 组件
   */
  fallback?: ReactNode;
  /**
   * 错误发生时的回调
   */
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
  /**
   * 恢复后的回调
   */
  onRecover?: (() => void) | undefined;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

// ============ ErrorBoundary Class Component ============

/**
 * ErrorBoundary 类组件
 *
 * React 19 仍需使用 class component 实现错误边界
 * 因为 getDerivedStateFromError 和 componentDidCatch
 * 只能在 class component 中使用
 */
class ErrorBoundaryClass extends Component<
  ErrorBoundaryProps & {
    logError: (error: Error, errorInfo: { componentStack?: string | null }) => void;
  },
  ErrorBoundaryState
> {
  constructor(
    props: ErrorBoundaryProps & {
      logError: (error: Error, errorInfo: { componentStack?: string | null }) => void;
    }
  ) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 通过 Jotai 记录错误
    this.props.logError(error, {
      componentStack: errorInfo.componentStack ?? null,
    });

    // 调用外部回调
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback />;
    }

    return this.props.children;
  }
}

// ============ ErrorBoundary Wrapper ============

/**
 * ErrorBoundary 函数式包装器
 *
 * 结合 Jotai 状态管理的 ErrorBoundary
 */
export function ErrorBoundary({
  children,
  fallback,
  onError,
  onRecover,
}: ErrorBoundaryProps) {
  const logError = useSetAtom(logErrorAtom);

  return (
    <ErrorBoundaryClass
      logError={logError}
      fallback={fallback ?? <DefaultErrorFallback onRecover={onRecover} />}
      onError={onError}
      onRecover={onRecover}
    >
      {children}
    </ErrorBoundaryClass>
  );
}

// ============ Default Fallback UI ============

type ErrorFallbackProps = {
  onRecover?: (() => void) | undefined;
};

/**
 * 默认的错误 Fallback UI
 */
function DefaultErrorFallback({ onRecover }: ErrorFallbackProps) {
  const error = useAtomValue(renderErrorAtom);
  const isRecovering = useAtomValue(isRecoveringAtom);
  const recover = useSetAtom(recoverFromErrorAtom);

  const handleRecover = async () => {
    await recover();
    onRecover?.();
    // 刷新页面以重置组件状态
    window.location.reload();
  };

  const handleReportError = () => {
    // 生产环境可以打开错误报告表单
    if (error) {
      const subject = encodeURIComponent(`Error Report: ${error.message}`);
      const body = encodeURIComponent(
        `Error Details:\n\nMessage: ${error.message}\n\nStack: ${error.stack ?? "N/A"}\n\nTime: ${new Date(error.timestamp).toISOString()}`
      );
      window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
    }
  };

  return (
    <div className="error-fallback">
      <div className="error-fallback-content">
        <div className="error-icon">💥</div>
        <h2 className="error-title">出错了</h2>
        <p className="error-message">
          应用遇到了一个意外错误，我们已经记录了这个问题。
        </p>

        {import.meta.env?.DEV && error && (
          <ErrorDetails error={error} />
        )}

        <div className="error-actions">
          <button
            onClick={handleRecover}
            disabled={isRecovering}
            className="btn btn-primary"
          >
            {isRecovering ? "恢复中..." : "重新加载"}
          </button>
          <button
            onClick={handleReportError}
            className="btn btn-outline"
          >
            报告问题
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Error Details (Dev Only) ============

type ErrorDetailsProps = {
  error: AppError;
};

/**
 * 错误详情组件（仅开发环境显示）
 */
function ErrorDetails({ error }: ErrorDetailsProps) {
  return (
    <details className="error-details">
      <summary>错误详情（开发模式）</summary>
      <div className="error-details-content">
        <div className="error-field">
          <span className="error-label">消息:</span>
          <code className="error-value">{error.message}</code>
        </div>
        {error.stack && (
          <div className="error-field">
            <span className="error-label">堆栈:</span>
            <pre className="error-stack">{error.stack}</pre>
          </div>
        )}
        {error.componentStack && (
          <div className="error-field">
            <span className="error-label">组件栈:</span>
            <pre className="error-stack">{error.componentStack}</pre>
          </div>
        )}
      </div>
    </details>
  );
}

// ============ Exports ============

export { DefaultErrorFallback as ErrorFallback };

