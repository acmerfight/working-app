/**
 * 认证表单相关 Atoms
 * 管理登录/注册表单的 UI 状态
 */
import { atom } from "jotai";

// ============ 类型定义 ============

export type AuthMode = "login" | "register";

// ============ State Atoms ============

/**
 * 当前认证模式（登录/注册）
 */
export const authModeAtom = atom<AuthMode>("login");

/**
 * 表单邮箱字段
 */
export const authFormEmailAtom = atom("");

/**
 * 表单密码字段
 */
export const authFormPasswordAtom = atom("");

/**
 * 表单姓名字段（注册时使用）
 */
export const authFormNameAtom = atom("");

/**
 * 表单确认密码字段（注册时使用）
 */
export const authFormConfirmPasswordAtom = atom("");

// ============ Action Atoms ============

/**
 * 切换认证模式
 */
export const toggleAuthModeAtom = atom(null, (get, set) => {
  const currentMode = get(authModeAtom);
  set(authModeAtom, currentMode === "login" ? "register" : "login");
  // 切换模式时重置表单
  set(authFormEmailAtom, "");
  set(authFormPasswordAtom, "");
  set(authFormNameAtom, "");
  set(authFormConfirmPasswordAtom, "");
});

/**
 * 设置认证模式
 */
export const setAuthModeAtom = atom(null, (_get, set, mode: AuthMode) => {
  set(authModeAtom, mode);
});

/**
 * 设置邮箱
 */
export const setAuthFormEmailAtom = atom(null, (_get, set, email: string) => {
  set(authFormEmailAtom, email);
});

/**
 * 设置密码
 */
export const setAuthFormPasswordAtom = atom(null, (_get, set, password: string) => {
  set(authFormPasswordAtom, password);
});

/**
 * 设置姓名
 */
export const setAuthFormNameAtom = atom(null, (_get, set, name: string) => {
  set(authFormNameAtom, name);
});

/**
 * 设置确认密码
 */
export const setAuthFormConfirmPasswordAtom = atom(null, (_get, set, password: string) => {
  set(authFormConfirmPasswordAtom, password);
});

/**
 * 重置表单
 */
export const resetAuthFormAtom = atom(null, (_get, set) => {
  set(authFormEmailAtom, "");
  set(authFormPasswordAtom, "");
  set(authFormNameAtom, "");
  set(authFormConfirmPasswordAtom, "");
});

