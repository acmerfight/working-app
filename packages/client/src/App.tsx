import { Provider, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { AuthPage } from "./components/auth";
import { Calendar } from "./components/calendar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { store } from "./store";
import { isAuthenticatedAtom, initAuthAtom } from "./store/atoms/auth";

/**
 * 应用主内容组件
 * 根据认证状态显示不同页面
 */
function AppContent() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const initAuth = useSetAtom(initAuthAtom);

  // 应用启动时初始化认证状态
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <Calendar />;
}

export function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Provider>
  );
}
