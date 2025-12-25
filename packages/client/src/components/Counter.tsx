import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  apiErrorAtom,
  apiLoadingAtom,
  apiMessageAtom,
  countAtom,
  decrementAtom,
  doubleCountAtom,
  echoInputAtom,
  fetchMessageAtom,
  incrementAtom,
  resetCountAtom,
  sendEchoAtom,
} from "../store";

export function Counter() {
  // 读取状态
  const count = useAtomValue(countAtom);
  const doubleCount = useAtomValue(doubleCountAtom);
  const apiMessage = useAtomValue(apiMessageAtom);
  const isLoading = useAtomValue(apiLoadingAtom);
  const apiError = useAtomValue(apiErrorAtom);
  const [inputValue, setInputValue] = useAtom(echoInputAtom);

  // Action atoms - useSetAtom 返回稳定的函数引用，无需 useCallback
  const increment = useSetAtom(incrementAtom);
  const decrement = useSetAtom(decrementAtom);
  const reset = useSetAtom(resetCountAtom);
  const fetchMessage = useSetAtom(fetchMessageAtom);
  const handleEcho = useSetAtom(sendEchoAtom);

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
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
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

