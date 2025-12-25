import { createStore } from "jotai";

// 创建全局 store 实例
export const store = createStore();

// 导出所有 atoms
export * from "./atoms";

