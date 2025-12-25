import { useAtom, useAtomValue } from "jotai";
import { useCallback, useState } from "react";
import { apiClient } from "../lib/api-client";
import {
  apiErrorAtom,
  apiLoadingAtom,
  apiMessageAtom,
  countAtom,
  doubleCountAtom,
} from "../store";

export function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubleCount = useAtomValue(doubleCountAtom);
  const [apiMessage, setApiMessage] = useAtom(apiMessageAtom);
  const [isLoading, setIsLoading] = useAtom(apiLoadingAtom);
  const [apiError, setApiError] = useAtom(apiErrorAtom);
  const [inputValue, setInputValue] = useState("");

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, [setCount]);

  const decrement = useCallback(() => {
    setCount((prev) => prev - 1);
  }, [setCount]);

  const reset = useCallback(() => {
    setCount(0);
  }, [setCount]);

  // 使用类型安全的 API 客户端
  const fetchMessage = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await apiClient.hello.$get();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // data 类型自动推断为 { message: string; timestamp: string }
      const data = await response.json();
      setApiMessage(data.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setApiMessage, setIsLoading, setApiError]);

  // 使用类型安全的 API 客户端
  const handleEcho = useCallback(async () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await apiClient.echo.$post({
        json: { message: inputValue },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // data 类型自动推断为 { echo: string; originalLength: number; timestamp: string }
      const data = await response.json();
      setApiMessage(data.echo);
      setInputValue("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, setApiMessage, setIsLoading, setApiError]);

  return (
    <section className="counter-section">
      <div className="counter-card">
        <h2>Jotai 状态管理示例</h2>
        <div className="counter-display">
          <span className="count-label">计数:</span>
          <span className="count-value">{count}</span>
        </div>
        <div className="counter-display">
          <span className="count-label">双倍值:</span>
          <span className="count-value secondary">{doubleCount}</span>
        </div>
        <div className="button-group">
          <button onClick={decrement} className="btn btn-secondary">
            -1
          </button>
          <button onClick={reset} className="btn btn-outline">
            重置
          </button>
          <button onClick={increment} className="btn btn-primary">
            +1
          </button>
        </div>
      </div>

      <div className="api-card">
        <h2>Hono API 测试</h2>
        <div className="api-actions">
          <button
            onClick={fetchMessage}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "加载中..." : "获取消息"}
          </button>
        </div>

        <div className="echo-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入要回显的消息..."
            className="input"
          />
          <button
            onClick={handleEcho}
            disabled={isLoading || !inputValue.trim()}
            className="btn btn-secondary"
          >
            发送
          </button>
        </div>

        {apiMessage && (
          <div className="api-result success">
            <span className="label">响应:</span>
            <span className="value">{apiMessage}</span>
          </div>
        )}
        {apiError && (
          <div className="api-result error">
            <span className="label">错误:</span>
            <span className="value">{apiError}</span>
          </div>
        )}
      </div>
    </section>
  );
}

