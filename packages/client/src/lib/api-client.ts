// API 客户端配置
// 生产环境中可以使用 hono/client 实现类型安全的 RPC 调用
// import { hc } from "hono/client";
// import type { AppType } from "@working-app/server/src/app";
// export const client = hc<AppType>(baseUrl);

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

