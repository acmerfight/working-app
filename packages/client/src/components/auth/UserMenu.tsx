/**
 * 用户菜单组件
 * 显示当前用户信息和登出按钮
 */
import { useAtomValue, useSetAtom } from "jotai";
import {
  currentUserAtom,
  logoutAtom,
  authLoadingAtom,
} from "../../store/atoms/auth";

export function UserMenu() {
  const user = useAtomValue(currentUserAtom);
  const isLoading = useAtomValue(authLoadingAtom);
  const logout = useSetAtom(logoutAtom);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
  };

  // 获取用户名首字母作为头像
  const avatar = user.name.charAt(0).toUpperCase();

  return (
    <div className="user-menu">
      <div className="user-menu__avatar">{avatar}</div>
      <div className="user-menu__info">
        <span className="user-menu__name">{user.name}</span>
        <span className="user-menu__email">{user.email}</span>
      </div>
      <button
        type="button"
        className="user-menu__logout"
        onClick={handleLogout}
        disabled={isLoading}
        title="退出登录"
      >
        {isLoading ? "..." : "退出"}
      </button>
    </div>
  );
}

