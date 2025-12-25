import { atom } from "jotai";

// 计数器 atom
export const countAtom = atom(0);

// 派生 atom 示例 - 计算双倍值
export const doubleCountAtom = atom((get) => get(countAtom) * 2);

// 异步 atom 示例 - 用于 API 调用
export const apiMessageAtom = atom<string | null>(null);
export const apiLoadingAtom = atom(false);
export const apiErrorAtom = atom<string | null>(null);

// Echo 输入框 atom
export const echoInputAtom = atom("");

