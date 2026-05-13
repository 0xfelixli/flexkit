export type ReplayResult = {
  response: string;
  status: number;
  time: string;
};

export function createReplayResult(requestText: string, sequence: number): ReplayResult {
  const firstLine = requestText.split("\n")[0] ?? "";
  const [, path = "/"] = firstLine.match(/^\w+\s+([^\s]+)/) ?? [];
  const status = path.includes("/auth/login") ? 302 : path.includes("/settings") ? 204 : 200;
  const time = `${40 + sequence * 7} ms`;

  if (status === 302) {
    return {
      status,
      time,
      response: `HTTP/1.1 302 Found
Location: /dashboard
Set-Cookie: session=replayed-${sequence}; HttpOnly
X-FlexKit-Replay: ${sequence}

Redirecting to /dashboard`,
    };
  }

  if (status === 204) {
    return {
      status,
      time,
      response: `HTTP/1.1 204 No Content
X-FlexKit-Replay: ${sequence}
Date: Wed, 13 May 2026 09:12:31 GMT`,
    };
  }

  return {
    status,
    time,
    response: `HTTP/1.1 200 OK
Content-Type: application/json
X-FlexKit-Replay: ${sequence}

{
  "replayed": true,
  "sequence": ${sequence},
  "path": "${path}"
}`,
  };
}
