import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

describe("GET /api/health", () => {
  const app = createApp();

  it("returns 200 with a status field", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("llmMode");
  });

  it("returns a consistent 404 error shape for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
