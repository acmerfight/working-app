/**
 * 登录/注册页面组件
 * 
 * ✅ 遵循渲染状态分离：
 * - 所有状态都来自 atoms（useAtomValue）
 * - 所有操作都通过 action atoms（useSetAtom）
 */
import { useAtomValue, useSetAtom } from "jotai";
import {
  authLoadingAtom,
  authErrorAtom,
  loginAtom,
  registerAtom,
  clearAuthErrorAtom,
} from "../../store/atoms/auth";
import {
  authModeAtom,
  authFormEmailAtom,
  authFormPasswordAtom,
  authFormNameAtom,
  authFormConfirmPasswordAtom,
  setAuthFormEmailAtom,
  setAuthFormPasswordAtom,
  setAuthFormNameAtom,
  setAuthFormConfirmPasswordAtom,
  toggleAuthModeAtom,
  resetAuthFormAtom,
} from "../../store/atoms/authForm";

export function AuthPage() {
  // 状态
  const mode = useAtomValue(authModeAtom);
  const email = useAtomValue(authFormEmailAtom);
  const password = useAtomValue(authFormPasswordAtom);
  const name = useAtomValue(authFormNameAtom);
  const confirmPassword = useAtomValue(authFormConfirmPasswordAtom);
  const isLoading = useAtomValue(authLoadingAtom);
  const error = useAtomValue(authErrorAtom);

  // Actions
  const login = useSetAtom(loginAtom);
  const register = useSetAtom(registerAtom);
  const setEmail = useSetAtom(setAuthFormEmailAtom);
  const setPassword = useSetAtom(setAuthFormPasswordAtom);
  const setName = useSetAtom(setAuthFormNameAtom);
  const setConfirmPassword = useSetAtom(setAuthFormConfirmPasswordAtom);
  const toggleMode = useSetAtom(toggleAuthModeAtom);
  const clearError = useSetAtom(clearAuthErrorAtom);
  const resetForm = useSetAtom(resetAuthFormAtom);

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        if (password !== confirmPassword) {
          throw new Error("两次输入的密码不一致");
        }
        await register({ name, email, password });
      }
      resetForm();
    } catch {
      // 错误已在 atom 中处理
    }
  };

  const handleToggleMode = () => {
    toggleMode();
    clearError();
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Logo 和标题 */}
        <div className="auth-header">
          <div className="auth-logo">📅</div>
          <h1 className="auth-title">日历应用</h1>
          <p className="auth-subtitle">
            {isLogin ? "登录您的账户" : "创建新账户"}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="auth-error">
            <span className="auth-error__icon">⚠️</span>
            <span className="auth-error__text">{error}</span>
          </div>
        )}

        {/* 表单 */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* 注册时显示姓名字段 */}
          {!isLogin && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">
                姓名
              </label>
              <input
                id="name"
                type="text"
                className="auth-input"
                placeholder="请输入您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                required
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder={isLogin ? "请输入密码" : "请设置密码（至少6位）"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
              minLength={6}
              disabled={isLoading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {/* 注册时显示确认密码字段 */}
          {!isLogin && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="confirmPassword">
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="auth-input"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                required
                minLength={6}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="auth-submit__loading">处理中...</span>
            ) : isLogin ? (
              "登录"
            ) : (
              "注册"
            )}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <div className="auth-switch">
          <span className="auth-switch__text">
            {isLogin ? "还没有账户？" : "已有账户？"}
          </span>
          <button
            type="button"
            className="auth-switch__btn"
            onClick={handleToggleMode}
            disabled={isLoading}
          >
            {isLogin ? "立即注册" : "立即登录"}
          </button>
        </div>

        {/* 底部信息 */}
        <div className="auth-footer">
          <p>© 2025 日历应用 - 使用 React + Jotai + Hono 构建</p>
        </div>
      </div>
    </div>
  );
}

