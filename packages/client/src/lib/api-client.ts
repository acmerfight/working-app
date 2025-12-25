// API 响应类型定义
interface HelloResponse {
  message: string;
  timestamp: string;
}

interface EchoResponse {
  echo: string;
  originalLength: number;
  timestamp: string;
}

interface EchoRequest {
  message: string;
}

const baseUrl = "/api";

// 类型安全的 API 客户端
export const apiClient = {
  hello: {
    async $get(): Promise<Response> {
      return fetch(`${baseUrl}/hello`);
    },
  },
  echo: {
    async $post(options: { json: EchoRequest }): Promise<Response> {
      return fetch(`${baseUrl}/echo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options.json),
      });
    },
  },
};

// 类型化的响应解析器
export async function parseHelloResponse(res: Response): Promise<HelloResponse> {
  return res.json() as Promise<HelloResponse>;
}

export async function parseEchoResponse(res: Response): Promise<EchoResponse> {
  return res.json() as Promise<EchoResponse>;
}

// 通用 API 函数
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new Error(`API Error: ${String(res.status)}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API Error: ${String(res.status)}`);
  return res.json() as Promise<T>;
}

