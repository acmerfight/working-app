import { describe, expect, it } from "vitest";
import { app } from "../app";

describe("API", () => {
  it("GET /api/hello returns message", async () => {
    const res = await app.request("/api/hello");
    expect(res.status).toBe(200);

    const json = (await res.json()) as { message: string };
    expect(json.message).toBe("Hello from Hono! 🔥");
  });
});

