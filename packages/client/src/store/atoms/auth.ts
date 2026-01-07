/**
 * 认证相关 Atoms
 * 处理用户登录、注册、登出和认证状态管理
 */
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { apiClient } from "../../lib/api-client";

// ============ 类型定义 ============

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
};

export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

// ============ State Atoms ============

/**
 * 当前登录用户（持久化存储）
 */
export const currentUserAtom = atomWithStorage<User | null>("auth_user", null);

/**
 * JWT Token（持久化存储）
 */
export const authTokenAtom = atomWithStorage<string | null>("auth_token", null);

/**
 * 认证加载状态
 */
export const authLoadingAtom = atom(false);

/**
 * 认证错误信息
 */
export const authErrorAtom = atom<string | null>(null);

// ============ Derived Atoms ============

/**
 * 是否已登录
 */
export const isAuthenticatedAtom = atom((get) => {
  const user = get(currentUserAtom);
  const token = get(authTokenAtom);
  return user !== null && token !== null;
});

// ============ Action Atoms ============

/**
 * 用户注册
 */
export const registerAtom = atom(null, async (_get, set, data: RegisterData) => {
  set(authLoadingAtom, true);
  set(authErrorAtom, null);

  try {
    const response = await apiClient.auth.register.$post({
      json: data,
    });

    const result = await response.json();
    
    if (!response.ok) {
      // 处理各种错误格式
      let errorMessage = "注册失败";
      if (typeof result === 'object' && result !== null) {
        if ('error' in result) {
          const err = (result as { error: unknown }).error;
          errorMessage = typeof err === 'string' ? err : JSON.stringify(err);
        } else if ('message' in result) {
          const msg = (result as { message: unknown }).message;
          errorMessage = typeof msg === 'string' ? msg : JSON.stringify(msg);
        }
      }
      throw new Error(errorMessage);
    }

    const responseData = result as {
      user: User;
      token: string;
      message: string;
    };

    // 保存用户信息和 token
    set(currentUserAtom, responseData.user);
    set(authTokenAtom, responseData.token);

    return responseData;
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败";
    set(authErrorAtom, message);
    throw error;
  } finally {
    set(authLoadingAtom, false);
  }
});

/**
 * 用户登录
 */
export const loginAtom = atom(null, async (_get, set, data: LoginData) => {
  set(authLoadingAtom, true);
  set(authErrorAtom, null);

  try {
    const response = await apiClient.auth.login.$post({
      json: data,
    });

    const result = await response.json();
    
    if (!response.ok) {
      // 处理各种错误格式
      let errorMessage = "登录失败";
      if (typeof result === 'object' && result !== null) {
        if ('error' in result) {
          const err = (result as { error: unknown }).error;
          errorMessage = typeof err === 'string' ? err : JSON.stringify(err);
        } else if ('message' in result) {
          const msg = (result as { message: unknown }).message;
          errorMessage = typeof msg === 'string' ? msg : JSON.stringify(msg);
        }
      }
      throw new Error(errorMessage);
    }

    const loginData = result as {
      user: User;
      token: string;
      message: string;
    };

    // 保存用户信息和 token
    set(currentUserAtom, loginData.user);
    set(authTokenAtom, loginData.token);

    return loginData;
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    set(authErrorAtom, message);
    throw error;
  } finally {
    set(authLoadingAtom, false);
  }
});

/**
 * 用户登出
 */
export const logoutAtom = atom(null, async (get, set) => {
  set(authLoadingAtom, true);

  try {
    const token = get(authTokenAtom);
    if (token) {
      // 调用后端登出接口（可选，主要用于日志记录）
      await apiClient.auth.logout.$post(undefined, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch {
    // 即使后端调用失败也清除本地状态
  } finally {
    // 清除本地认证状态
    set(currentUserAtom, null);
    set(authTokenAtom, null);
    set(authLoadingAtom, false);
  }
});

/**
 * 获取当前用户信息
 */
export const fetchCurrentUserAtom = atom(null, async (get, set) => {
  const token = get(authTokenAtom);
  if (!token) {
    set(currentUserAtom, null);
    return null;
  }

  set(authLoadingAtom, true);
  set(authErrorAtom, null);

  try {
    const response = await apiClient.auth.me.$get(undefined, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token 无效或过期，清除认证状态
      if (response.status === 401) {
        set(currentUserAtom, null);
        set(authTokenAtom, null);
        return null;
      }
      throw new Error("获取用户信息失败");
    }

    const result = await response.json() as { user: User };
    set(currentUserAtom, result.user);
    return result.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取用户信息失败";
    set(authErrorAtom, message);
    return null;
  } finally {
    set(authLoadingAtom, false);
  }
});

/**
 * 修改密码
 */
export const changePasswordAtom = atom(
  null,
  async (get, set, data: ChangePasswordData) => {
    const token = get(authTokenAtom);
    if (!token) {
      set(authErrorAtom, "请先登录");
      throw new Error("请先登录");
    }

    set(authLoadingAtom, true);
    set(authErrorAtom, null);

    try {
      const response = await apiClient.auth.password.$put(
        {
          json: data,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error ?? "修改密码失败");
      }

      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : "修改密码失败";
      set(authErrorAtom, message);
      throw error;
    } finally {
      set(authLoadingAtom, false);
    }
  }
);

/**
 * 清除认证错误
 */
export const clearAuthErrorAtom = atom(null, (_get, set) => {
  set(authErrorAtom, null);
});

/**
 * 初始化认证状态（应用启动时调用）
 */
export const initAuthAtom = atom(null, async (get, set) => {
  const token = get(authTokenAtom);
  if (token) {
    // 验证 token 是否有效
    await set(fetchCurrentUserAtom);
  }
});

