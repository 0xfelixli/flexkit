import { expect, test } from "bun:test";
import { createReplayResult } from "./repeater";

test("creates a deterministic replay response for a users request", () => {
  const result = createReplayResult(
    "GET /api/users?page=2 HTTP/1.1\nHost: app.local",
    3,
  );

  expect(result.status).toBe(200);
  expect(result.time).toBe("61 ms");
  expect(result.response).toContain('"replayed": true');
  expect(result.response).toContain('"sequence": 3');
});

test("marks auth requests as redirected", () => {
  const result = createReplayResult("POST /auth/login HTTP/1.1\nHost: app.local", 1);

  expect(result.status).toBe(302);
  expect(result.response).toContain("Location: /dashboard");
});
