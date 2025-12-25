/**
 * Feature: 用户认证
 * As a 用户
 * I want 能够注册和登录
 * So that 可以使用日历应用
 *
 * 测试策略：通过 Jotai Atoms 测试，直接调用 Hono 后端
 */

import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "@working-app/server/app";
import {
  authErrorAtom,
  authLoadingAtom,
  authTokenAtom,
  currentUserAtom,
  isAuthenticatedAtom,
  loginAtom,
  logoutAtom,
  registerAtom,
  fetchCurrentUserAtom,
  changePasswordAtom,
  clearAuthErrorAtom,
} from "../atoms/auth";
import {
  authFormEmailAtom,
  authFormNameAtom,
  authFormPasswordAtom,
  authFormConfirmPasswordAtom,
  authModeAtom,
  toggleAuthModeAtom,
  resetAuthFormAtom,
  setAuthFormEmailAtom,
  setAuthFormPasswordAtom,
  setAuthFormNameAtom,
} from "../atoms/authForm";

/**
 * 配置 fetch 使用 Hono app 处理请求
 */
function setupHonoFetch() {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const fullUrl = url.startsWith("http") ? url : `http://localhost${url}`;
    return app.request(fullUrl, init);
  });
}

/**
 * 辅助函数：追踪 loading 状态变化
 */
function trackLoadingChanges(store: ReturnType<typeof createStore>) {
  const history: boolean[] = [];
  store.sub(authLoadingAtom, () => {
    history.push(store.get(authLoadingAtom));
  });
  return history;
}

// 生成唯一邮箱避免测试冲突
let emailCounter = 0;
function generateUniqueEmail() {
  emailCounter++;
  return `test${Date.now()}_${emailCounter}@example.com`;
}

// ============================================================
// Feature: 用户注册
// ============================================================

describe("Feature: 用户注册", () => {
  beforeEach(() => {
    setupHonoFetch();
    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 成功注册新用户", () => {
    it("Given 一个新邮箱, When 提交注册, Then 应该创建用户并自动登录", async () => {
      // Given
      const store = createStore();
      const loadingHistory = trackLoadingChanges(store);
      const email = generateUniqueEmail();
      
      expect(store.get(currentUserAtom)).toBeNull();
      expect(store.get(authTokenAtom)).toBeNull();
      expect(store.get(isAuthenticatedAtom)).toBe(false);

      // When
      await store.set(registerAtom, {
        name: "测试用户",
        email,
        password: "password123",
      });

      // Then
      const user = store.get(currentUserAtom);
      expect(user).not.toBeNull();
      expect(user?.name).toBe("测试用户");
      expect(user?.email).toBe(email);
      expect(store.get(authTokenAtom)).not.toBeNull();
      expect(store.get(isAuthenticatedAtom)).toBe(true);
      expect(store.get(authErrorAtom)).toBeNull();
      expect(loadingHistory).toEqual([true, false]);
    });
  });

  describe("Scenario: 注册已存在的邮箱", () => {
    it("Given 已注册的邮箱, When 再次注册, Then 应该显示错误", async () => {
      // Given
      const store = createStore();
      const email = generateUniqueEmail();
      
      // 先注册一个用户
      await store.set(registerAtom, {
        name: "用户1",
        email,
        password: "password123",
      });
      
      // 登出
      await store.set(logoutAtom);
      
      // When - 尝试用相同邮箱再次注册
      await expect(store.set(registerAtom, {
        name: "用户2",
        email,
        password: "password456",
      })).rejects.toThrow("该邮箱已被注册");

      // Then
      expect(store.get(authErrorAtom)).toBe("该邮箱已被注册");
      expect(store.get(currentUserAtom)).toBeNull();
    });
  });
});

// ============================================================
// Feature: 用户登录
// ============================================================

describe("Feature: 用户登录", () => {
  let testEmail: string;
  
  beforeEach(async () => {
    setupHonoFetch();
    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    });
    
    // 创建测试用户
    testEmail = generateUniqueEmail();
    const store = createStore();
    await store.set(registerAtom, {
      name: "登录测试用户",
      email: testEmail,
      password: "testpass123",
    });
    await store.set(logoutAtom);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 成功登录", () => {
    it("Given 有效的凭证, When 提交登录, Then 应该成功登录", async () => {
      // Given
      const store = createStore();
      const loadingHistory = trackLoadingChanges(store);
      
      expect(store.get(isAuthenticatedAtom)).toBe(false);

      // When
      await store.set(loginAtom, {
        email: testEmail,
        password: "testpass123",
      });

      // Then
      const user = store.get(currentUserAtom);
      expect(user).not.toBeNull();
      expect(user?.email).toBe(testEmail);
      expect(store.get(authTokenAtom)).not.toBeNull();
      expect(store.get(isAuthenticatedAtom)).toBe(true);
      expect(store.get(authErrorAtom)).toBeNull();
      expect(loadingHistory).toEqual([true, false]);
    });
  });

  describe("Scenario: 登录失败 - 密码错误", () => {
    it("Given 错误的密码, When 提交登录, Then 应该显示错误", async () => {
      // Given
      const store = createStore();

      // When
      await expect(store.set(loginAtom, {
        email: testEmail,
        password: "wrongpassword",
      })).rejects.toThrow("邮箱或密码错误");

      // Then
      expect(store.get(authErrorAtom)).toBe("邮箱或密码错误");
      expect(store.get(isAuthenticatedAtom)).toBe(false);
    });
  });

  describe("Scenario: 登录失败 - 用户不存在", () => {
    it("Given 不存在的邮箱, When 提交登录, Then 应该显示错误", async () => {
      // Given
      const store = createStore();

      // When
      await expect(store.set(loginAtom, {
        email: "nonexistent@example.com",
        password: "anypassword",
      })).rejects.toThrow("邮箱或密码错误");

      // Then
      expect(store.get(authErrorAtom)).toBe("邮箱或密码错误");
    });
  });
});

// ============================================================
// Feature: 用户登出
// ============================================================

describe("Feature: 用户登出", () => {
  beforeEach(() => {
    setupHonoFetch();
    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 成功登出", () => {
    it("Given 已登录的用户, When 点击登出, Then 应该清除认证状态", async () => {
      // Given
      const store = createStore();
      await store.set(registerAtom, {
        name: "登出测试用户",
        email: generateUniqueEmail(),
        password: "password123",
      });
      
      expect(store.get(isAuthenticatedAtom)).toBe(true);

      // When
      await store.set(logoutAtom);

      // Then
      expect(store.get(currentUserAtom)).toBeNull();
      expect(store.get(authTokenAtom)).toBeNull();
      expect(store.get(isAuthenticatedAtom)).toBe(false);
    });
  });
});

// ============================================================
// Feature: 获取当前用户信息
// ============================================================

describe("Feature: 获取当前用户信息", () => {
  beforeEach(() => {
    setupHonoFetch();
    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 有效 token 获取用户信息", () => {
    it("Given 有效的 token, When 获取用户信息, Then 应该返回用户数据", async () => {
      // Given
      const store = createStore();
      const email = generateUniqueEmail();
      await store.set(registerAtom, {
        name: "信息测试用户",
        email,
        password: "password123",
      });
      
      const token = store.get(authTokenAtom);
      expect(token).not.toBeNull();

      // When
      const user = await store.set(fetchCurrentUserAtom);

      // Then
      expect(user).not.toBeNull();
      expect(user?.email).toBe(email);
    });
  });

  describe("Scenario: 无 token 时获取用户信息", () => {
    it("Given 无 token, When 获取用户信息, Then 应该返回 null", async () => {
      // Given
      const store = createStore();
      expect(store.get(authTokenAtom)).toBeNull();

      // When
      const result = await store.set(fetchCurrentUserAtom);

      // Then
      expect(result).toBeNull();
    });
  });
});

// ============================================================
// Feature: 修改密码
// ============================================================

describe("Feature: 修改密码", () => {
  let testEmail: string;
  
  beforeEach(async () => {
    setupHonoFetch();
    const storage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    });
    
    // 创建并登录测试用户
    testEmail = generateUniqueEmail();
    const store = createStore();
    await store.set(registerAtom, {
      name: "密码测试用户",
      email: testEmail,
      password: "oldpassword123",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Scenario: 成功修改密码", () => {
    it("Given 已登录用户, When 提交正确的当前密码和新密码, Then 应该成功修改", async () => {
      // Given
      const store = createStore();
      // 需要重新登录获取 token
      await store.set(loginAtom, {
        email: testEmail,
        password: "oldpassword123",
      });
      
      expect(store.get(isAuthenticatedAtom)).toBe(true);

      // When
      await store.set(changePasswordAtom, {
        currentPassword: "oldpassword123",
        newPassword: "newpassword456",
      });

      // Then - 用新密码登录验证
      await store.set(logoutAtom);
      await store.set(loginAtom, {
        email: testEmail,
        password: "newpassword456",
      });
      
      expect(store.get(isAuthenticatedAtom)).toBe(true);
    });
  });

  describe("Scenario: 修改密码失败 - 当前密码错误", () => {
    it("Given 错误的当前密码, When 提交修改, Then 应该显示错误", async () => {
      // Given
      const store = createStore();
      await store.set(loginAtom, {
        email: testEmail,
        password: "oldpassword123",
      });

      // When
      await expect(store.set(changePasswordAtom, {
        currentPassword: "wrongpassword",
        newPassword: "newpassword456",
      })).rejects.toThrow("当前密码错误");

      // Then
      expect(store.get(authErrorAtom)).toBe("当前密码错误");
    });
  });
});

// ============================================================
// Feature: 认证表单状态
// ============================================================

describe("Feature: 认证表单状态", () => {
  describe("Scenario: 切换登录/注册模式", () => {
    it("Given 登录模式, When 切换模式, Then 应该变为注册模式并清空表单", () => {
      // Given
      const store = createStore();
      store.set(setAuthFormEmailAtom, "test@example.com");
      store.set(setAuthFormPasswordAtom, "password");
      
      expect(store.get(authModeAtom)).toBe("login");
      expect(store.get(authFormEmailAtom)).toBe("test@example.com");

      // When
      store.set(toggleAuthModeAtom);

      // Then
      expect(store.get(authModeAtom)).toBe("register");
      expect(store.get(authFormEmailAtom)).toBe("");
      expect(store.get(authFormPasswordAtom)).toBe("");
    });
  });

  describe("Scenario: 重置表单", () => {
    it("Given 填写了表单, When 重置表单, Then 所有字段应该清空", () => {
      // Given
      const store = createStore();
      store.set(setAuthFormEmailAtom, "test@example.com");
      store.set(setAuthFormPasswordAtom, "password");
      store.set(setAuthFormNameAtom, "测试用户");

      // When
      store.set(resetAuthFormAtom);

      // Then
      expect(store.get(authFormEmailAtom)).toBe("");
      expect(store.get(authFormPasswordAtom)).toBe("");
      expect(store.get(authFormNameAtom)).toBe("");
      expect(store.get(authFormConfirmPasswordAtom)).toBe("");
    });
  });

  describe("Scenario: 清除认证错误", () => {
    it("Given 存在认证错误, When 清除错误, Then 错误应该被清除", async () => {
      // Given
      const store = createStore();
      setupHonoFetch();
      const storage: Record<string, string> = {};
      vi.stubGlobal("localStorage", {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => { storage[key] = value; },
        removeItem: (key: string) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
      });
      
      // 触发一个错误
      try {
        await store.set(loginAtom, {
          email: "nonexistent@example.com",
          password: "password",
        });
      } catch {
        // 预期会失败
      }
      
      expect(store.get(authErrorAtom)).not.toBeNull();

      // When
      store.set(clearAuthErrorAtom);

      // Then
      expect(store.get(authErrorAtom)).toBeNull();
    });
  });
});

