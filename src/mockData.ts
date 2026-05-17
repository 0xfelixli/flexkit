import {
  type EditorMode,
  type HttpRequest,
  type InspectorTab,
  type ProxyTab,
  type RepeaterItem,
} from "./types";

export const modules = ["Proxy", "Target", "Repeater", "Scanner", "Logger"];

export const proxyTabs: ProxyTab[] = [
  "Intercept",
  "HTTP History",
  "WebSockets",
  "Match & Replace",
  "Settings",
];

export const filterChips = [
  "Method: all",
  "Status: all",
  "Scope: in",
  "Issues: open",
];

export const editorModes: EditorMode[] = ["Pretty", "Raw", "Hex"];

export const inspectorTabs: InspectorTab[] = [
  "Issues",
  "Headers",
  "Params",
  "Cookies",
];

export const requests: HttpRequest[] = [
  {
    id: 1024,
    host: "app.local",
    method: "GET",
    path: "/api/users?page=1",
    status: 200,
    type: "json",
    length: "4.8 KB",
    time: "42 ms",
    risk: "Low",
    request: `GET /api/users?page=1 HTTP/1.1
Host: app.local
Authorization: Bearer eyJhbGciOi...
Accept: application/json
User-Agent: FlexKit/0.1

{
  "role": "admin",
  "active": true
}`,
    response: `HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session=mock-session; HttpOnly

{
  "users": [
    {
      "id": 1,
      "email": "admin@app.local",
      "role": "admin"
    }
  ]
}`,
    headers: [
      ["Host", "app.local"],
      ["Authorization", "Bearer eyJhbGciOi..."],
      ["Accept", "application/json"],
    ],
    params: [
      ["page", "1"],
      ["role", "admin"],
      ["active", "true"],
    ],
    cookies: [["session", "mock-session"]],
    issue: {
      title: "Sensitive admin query",
      description:
        "This request includes an admin role filter. Review authorization checks and data access scope.",
    },
  },
  {
    id: 1023,
    host: "app.local",
    method: "POST",
    path: "/auth/login",
    status: 302,
    type: "html",
    length: "1.2 KB",
    time: "95 ms",
    risk: "Medium",
    request: `POST /auth/login HTTP/1.1
Host: app.local
Content-Type: application/json
Cookie: landing=mock

{
  "email": "admin@app.local",
  "password": "••••••••"
}`,
    response: `HTTP/1.1 302 Found
Location: /dashboard
Set-Cookie: session=mock-session; HttpOnly

Redirecting to /dashboard`,
    headers: [
      ["Host", "app.local"],
      ["Content-Type", "application/json"],
      ["Cookie", "landing=mock"],
    ],
    params: [
      ["email", "admin@app.local"],
      ["password", "masked"],
    ],
    cookies: [["landing", "mock"]],
    issue: {
      title: "Potential CSRF risk",
      description:
        "Cookie-authenticated POST request does not include an obvious CSRF token in the request body.",
    },
  },
  {
    id: 1022,
    host: "app.local",
    method: "GET",
    path: "/assets/app.js",
    status: 200,
    type: "js",
    length: "92 KB",
    time: "18 ms",
    risk: "Info",
    request: `GET /assets/app.js HTTP/1.1
Host: app.local
Accept: */*
If-None-Match: "mock-etag"`,
    response: `HTTP/1.1 200 OK
Content-Type: application/javascript
Cache-Control: public, max-age=31536000

import("./chunks/dashboard.js");`,
    headers: [
      ["Host", "app.local"],
      ["Accept", "*/*"],
      ["If-None-Match", '"mock-etag"'],
    ],
    params: [],
    cookies: [],
    issue: {
      title: "Cache policy observed",
      description:
        "Static asset cache headers are present and aligned with long-lived caching expectations.",
    },
  },
  {
    id: 1021,
    host: "admin.local",
    method: "PUT",
    path: "/settings/security",
    status: 204,
    type: "json",
    length: "0 B",
    time: "126 ms",
    risk: "Medium",
    request: `PUT /settings/security HTTP/1.1
Host: admin.local
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...

{
  "mfaRequired": false,
  "sessionTimeout": 1440
}`,
    response: `HTTP/1.1 204 No Content
Date: Tue, 12 May 2026 09:12:31 GMT`,
    headers: [
      ["Host", "admin.local"],
      ["Content-Type", "application/json"],
      ["Authorization", "Bearer eyJhbGciOi..."],
    ],
    params: [
      ["mfaRequired", "false"],
      ["sessionTimeout", "1440"],
    ],
    cookies: [],
    issue: {
      title: "Security setting changed",
      description:
        "This request disables MFA requirements. Confirm policy controls and change authorization.",
    },
  },
];

export const repeaterSeeds: RepeaterItem[] = [
  {
    id: "rep-1",
    name: "Users pagination",
    method: "GET",
    target: "https://app.local/api/users?page=1",
    request: requests[0].request,
    response: requests[0].response,
    status: requests[0].status,
    time: requests[0].time,
    lastRun: "Imported",
  },
  {
    id: "rep-2",
    name: "Login redirect",
    method: "POST",
    target: "https://app.local/auth/login",
    request: requests[1].request,
    response: requests[1].response,
    status: requests[1].status,
    time: requests[1].time,
    lastRun: "Imported",
  },
  {
    id: "rep-3",
    name: "Security settings",
    method: "PUT",
    target: "https://admin.local/settings/security",
    request: requests[3].request,
    response: requests[3].response,
    status: requests[3].status,
    time: requests[3].time,
    lastRun: "Imported",
  },
];
