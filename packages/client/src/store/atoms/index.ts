import { atom } from "jotai";
import {
  apiClient,
  parseEchoResponse,
  parseHelloResponse,
} from "../../lib/api-client";

// ============ 基础 State Atoms ============

// 计数器 atom
export const countAtom = atom(0);

// 派生 atom 示例 - 计算双倍值
export const doubleCountAtom = atom((get) => get(countAtom) * 2);

// API 状态 atoms
export const apiMessageAtom = atom<string | null>(null);
export const apiLoadingAtom = atom(false);
export const apiErrorAtom = atom<string | null>(null);

// Echo 输入框 atom
export const echoInputAtom = atom("");

// ============ Action Atoms (替代 useCallback) ============

// 计数器 actions
export const incrementAtom = atom(null, (get, set) => {
  set(countAtom, get(countAtom) + 1);
});

export const decrementAtom = atom(null, (get, set) => {
  set(countAtom, get(countAtom) - 1);
});

export const resetCountAtom = atom(null, (_get, set) => {
  set(countAtom, 0);
});

// API actions
export const fetchMessageAtom = atom(null, async (_get, set) => {
  set(apiLoadingAtom, true);
  set(apiErrorAtom, null);
  try {
    const response = await apiClient.hello.$get();
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    const data = await parseHelloResponse(response);
    set(apiMessageAtom, data.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(apiErrorAtom, message);
  } finally {
    set(apiLoadingAtom, false);
  }
});

export const sendEchoAtom = atom(null, async (get, set) => {
  const inputValue = get(echoInputAtom);
  if (!inputValue.trim()) return;

  set(apiLoadingAtom, true);
  set(apiErrorAtom, null);
  try {
    const response = await apiClient.echo.$post({
      json: { message: inputValue },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${String(response.status)}`);
    }
    const data = await parseEchoResponse(response);
    set(apiMessageAtom, data.echo);
    set(echoInputAtom, "");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    set(apiErrorAtom, message);
  } finally {
    set(apiLoadingAtom, false);
  }
});

