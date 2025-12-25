import { hc } from "hono/client";
import type { AppType } from "@working-app/server/app";

// 类型安全的 API 客户端
// 自动推断所有 API 端点的请求/响应类型
export const api = hc<AppType>("/");

// 便捷访问器
export const apiClient = api.api;

// 使用示例:
// const res = await apiClient.hello.$get();
// const data = await res.json(); // 自动推断类型为 { message: string; timestamp: string }
//
// const res = await apiClient.echo.$post({ json: { message: "hello" } });
// const data = await res.json(); // 自动推断类型
//
// const res = await apiClient.users.$get();
// const data = await res.json(); // 自动推断类型为 { users: User[] }

// 保留原有的通用函数以兼容旧代码
const baseUrl = "/api";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json() as Promise<T>;
}

