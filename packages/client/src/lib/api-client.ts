import { hc } from "hono/client";
import type { AppType } from "@working-app/server/app";

/**
 * 端到端类型安全的 API 客户端
 *
 * 使用 Hono RPC 客户端，类型自动从服务端推导
 * - 请求参数类型安全
 * - 响应类型自动推导
 * - 完整的 IDE 智能提示
 */
export const api = hc<AppType>("/");

// 导出便捷的 API 访问器
export const apiClient = api.api;

/**
 * 类型安全的响应解析辅助函数
 *
 * 使用 Hono client 返回的响应会自动带有类型
 * 通过 .json() 解析后直接获得正确类型
 */
export type ApiClient = typeof apiClient;

/**
 * 推导 API 响应类型的辅助类型
 */
export type InferResponseType<T> = T extends () => Promise<infer R>
  ? R extends Response
    ? Awaited<ReturnType<R["json"]>>
    : never
  : never;
