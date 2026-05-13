import { lazy, Suspense, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  type Row,
  type Table,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Group, Panel, Separator } from "react-resizable-panels";
import { type EditorMode } from "./editorFormatting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createReplayResult } from "./repeater";
import "./App.css";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";
type InspectorTab = "Issues" | "Headers" | "Params" | "Cookies";

type HttpRequest = {
  id: number;
  host: string;
  method: RequestMethod;
  path: string;
  status: number;
  length: string;
  time: string;
  risk: "Low" | "Medium" | "Info";
  request: string;
  response: string;
  headers: Array<[string, string]>;
  params: Array<[string, string]>;
  cookies: Array<[string, string]>;
  issue: {
    title: string;
    description: string;
  };
};

type RepeaterItem = {
  id: string;
  name: string;
  method: RequestMethod;
  target: string;
  request: string;
  response: string;
  status: number;
  time: string;
  lastRun: string;
};

const modules = ["Proxy", "Target", "Repeater", "Scanner", "Logger"];
const filterChips = ["Method: all", "Status: all", "In scope", "JSON"];
const editorModes: EditorMode[] = ["Pretty", "Raw", "Hex"];
const inspectorTabs: InspectorTab[] = ["Issues", "Headers", "Params", "Cookies"];
const columnHelper = createColumnHelper<HttpRequest>();
const CodeEditor = lazy(() => import("./CodeEditor"));

const historyColumns = [
  columnHelper.accessor("id", {
    header: "#",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("method", {
    header: "Method",
    cell: (info) => (
      <span className={`method method-${info.getValue().toLowerCase()}`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("host", {
    header: "Host",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("path", {
    header: "Path",
    cell: (info) => <span className="path-cell">{info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("length", {
    header: "Length",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("time", {
    header: "Time",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("risk", {
    header: "Risk",
    cell: (info) => (
      <Badge
        className={`risk risk-${info.getValue().toLowerCase()}`}
        variant="outline"
      >
        {info.getValue()}
      </Badge>
    ),
  }),
];

const requests: HttpRequest[] = [
  {
    id: 1024,
    host: "app.local",
    method: "GET",
    path: "/api/users?page=1",
    status: 200,
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
        "The selected request exposes an admin role filter. Validate authorization behavior before shipping.",
    },
  },
  {
    id: 1023,
    host: "app.local",
    method: "POST",
    path: "/auth/login",
    status: 302,
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
        "Cookie-authenticated POST request does not include an obvious CSRF token in the mock payload.",
    },
  },
  {
    id: 1022,
    host: "app.local",
    method: "GET",
    path: "/assets/app.js",
    status: 200,
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
        "Static asset cache headers are present. No immediate action in this mock record.",
    },
  },
  {
    id: 1021,
    host: "admin.local",
    method: "PUT",
    path: "/settings/security",
    status: 204,
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
        "The mock request disables MFA. This is highlighted for review in future active testing workflows.",
    },
  },
];

const repeaterSeeds: RepeaterItem[] = [
  {
    id: "rep-1",
    name: "Users pagination",
    method: "GET",
    target: "https://app.local/api/users?page=1",
    request: requests[0].request,
    response: requests[0].response,
    status: requests[0].status,
    time: requests[0].time,
    lastRun: "Seeded",
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
    lastRun: "Seeded",
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
    lastRun: "Seeded",
  },
];

function App() {
  const [activeModule, setActiveModule] = useState("Proxy");
  const [selectedRequestId, setSelectedRequestId] = useState(requests[0].id);
  const [requestMode, setRequestMode] = useState<EditorMode>("Pretty");
  const [responseMode, setResponseMode] = useState<EditorMode>("Pretty");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("Issues");
  const [repeaterItems, setRepeaterItems] = useState(repeaterSeeds);
  const [selectedRepeaterId, setSelectedRepeaterId] = useState(repeaterSeeds[0].id);
  const [repeaterRequestMode, setRepeaterRequestMode] =
    useState<EditorMode>("Pretty");
  const [repeaterResponseMode, setRepeaterResponseMode] =
    useState<EditorMode>("Pretty");
  const [replaySequence, setReplaySequence] = useState(0);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) ?? requests[0],
    [selectedRequestId],
  );
  const table = useReactTable({
    columns: historyColumns,
    data: requests,
    getCoreRowModel: getCoreRowModel(),
  });
  const selectedRepeater =
    repeaterItems.find((item) => item.id === selectedRepeaterId) ??
    repeaterItems[0];

  function updateRepeaterRequest(requestText: string) {
    setRepeaterItems((items) =>
      items.map((item) =>
        item.id === selectedRepeater.id ? { ...item, request: requestText } : item,
      ),
    );
  }

  function sendRepeaterRequest() {
    const nextSequence = replaySequence + 1;
    const result = createReplayResult(selectedRepeater.request, nextSequence);

    setReplaySequence(nextSequence);
    setRepeaterItems((items) =>
      items.map((item) =>
        item.id === selectedRepeater.id
          ? {
              ...item,
              response: result.response,
              status: result.status,
              time: result.time,
              lastRun: `Replay #${nextSequence}`,
            }
          : item,
      ),
    );
  }

  return (
    <main className="app-shell">
      <header className="menu-bar">
        <div className="brand-cluster">
          <div className="brand-mark">F</div>
          <strong>FlexKit</strong>
          <nav className="menu-items" aria-label="Application menu">
            <Button className="chrome-button" size="xs" variant="ghost">
              File
            </Button>
            <Button className="chrome-button" size="xs" variant="ghost">
              Edit
            </Button>
            <Button className="chrome-button" size="xs" variant="ghost">
              View
            </Button>
            <Button className="chrome-button" size="xs" variant="ghost">
              Tools
            </Button>
          </nav>
        </div>
        <div className="session-state">
          <span className="status-dot" />
          Mock session
        </div>
      </header>

      <section className="module-bar" aria-label="Workspace modules">
        <Tabs
          className="module-tabs-wrapper"
          onValueChange={setActiveModule}
          value={activeModule}
        >
          <TabsList className="module-tabs" variant="line">
            {modules.map((module) => (
              <TabsTrigger className="module-tab" key={module} value={module}>
                {module}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="module-actions">
          <Button className="workbench-button secondary-action" size="sm" variant="outline">
            Intercept off
          </Button>
          <Button className="workbench-button primary-action" size="sm">
            New replay
          </Button>
        </div>
      </section>

      {activeModule === "Repeater" ? (
        <RepeaterWorkspace
          editorModes={editorModes}
          items={repeaterItems}
          onRequestChange={updateRepeaterRequest}
          onSend={sendRepeaterRequest}
          requestMode={repeaterRequestMode}
          responseMode={repeaterResponseMode}
          selectedItem={selectedRepeater}
          selectedItemId={selectedRepeater.id}
          setRequestMode={setRepeaterRequestMode}
          setResponseMode={setRepeaterResponseMode}
          setSelectedItemId={setSelectedRepeaterId}
        />
      ) : (
      <Group className="workspace" id="flexkit-workspace" orientation="horizontal">
        <Panel
          className="scope-panel panel"
          defaultSize="18%"
          id="scope"
          minSize="14%"
        >
          <aside className="panel-fill">
            <div className="panel-header">
              <strong>Scope</strong>
              <Button className="chrome-button" size="xs" variant="ghost">
                Filter
              </Button>
            </div>
            <div className="tree">
              <div className="tree-row strong">▾ app.local</div>
              <div className="tree-row indent-1">▾ /api</div>
              <Button className="tree-row indent-2 selected" size="xs" variant="ghost">
                users
              </Button>
              <Button className="tree-row indent-2" size="xs" variant="ghost">
                profile
              </Button>
              <Button className="tree-row indent-1" size="xs" variant="ghost">
                login
              </Button>
              <Button className="tree-row indent-1" size="xs" variant="ghost">
                checkout
              </Button>
              <div className="tree-row strong spacer">▾ admin.local</div>
              <Button className="tree-row indent-1" size="xs" variant="ghost">
                dashboard
              </Button>
              <Button className="tree-row indent-1" size="xs" variant="ghost">
                settings
              </Button>
              <div className="tree-label">Out of scope</div>
              <div className="tree-row muted">▸ cdn.app.local</div>
            </div>
          </aside>
        </Panel>

        <Separator className="resize-handle vertical" />

        <Panel
          className="traffic-panel"
          defaultSize="57%"
          id="traffic"
          minSize="38%"
        >
          <section className="traffic-panel-fill">
            <div className="filter-bar">
              {filterChips.map((chip) => (
                <Button className="workbench-button filter-chip" key={chip} size="sm" variant="outline">
                  {chip}
                </Button>
              ))}
              <label className="request-search">
                <span>Search</span>
                <Input placeholder="Filter requests..." />
              </label>
            </div>

            <Group className="traffic-split" orientation="vertical">
              <Panel defaultSize="38%" id="history" minSize="24%">
                <HistoryTable
                  selectedRequestId={selectedRequest.id}
                  setSelectedRequestId={setSelectedRequestId}
                  table={table}
                />
              </Panel>
              <Separator className="resize-handle horizontal" />
              <Panel defaultSize="62%" id="editors" minSize="36%">
                <Group className="editors" orientation="horizontal">
                  <Panel defaultSize="50%" id="request-editor" minSize="28%">
                    <EditorPane
                      modes={editorModes}
                      selectedMode={requestMode}
                      setSelectedMode={setRequestMode}
                      text={selectedRequest.request}
                      title="Request"
                    />
                  </Panel>
                  <Separator className="resize-handle vertical" />
                  <Panel defaultSize="50%" id="response-editor" minSize="28%">
                    <EditorPane
                      modes={editorModes}
                      selectedMode={responseMode}
                      setSelectedMode={setResponseMode}
                      text={selectedRequest.response}
                      title="Response"
                    />
                  </Panel>
                </Group>
              </Panel>
            </Group>
          </section>
        </Panel>

        <Separator className="resize-handle vertical inspector-resize" />

        <Panel
          className="inspector-panel panel"
          defaultSize="25%"
          id="inspector"
          minSize="18%"
        >
          <aside className="panel-fill">
            <div className="panel-header">
              <strong>Inspector</strong>
              <span>{selectedRequest.host}</span>
            </div>
            <Tabs
              onValueChange={(tab) => setInspectorTab(tab as InspectorTab)}
              value={inspectorTab}
            >
              <TabsList
                aria-label="Inspector tabs"
                className="inspector-tabs"
                variant="line"
              >
                {inspectorTabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <InspectorContent request={selectedRequest} tab={inspectorTab} />
          </aside>
        </Panel>
      </Group>
      )}

      <footer className="status-bar">
        <span>{requests.length} requests · 3 in scope · {selectedRequest.id} selected</span>
        <span>{activeModule} mock · No live traffic</span>
      </footer>
    </main>
  );
}

type HistoryTableProps = {
  selectedRequestId: number;
  setSelectedRequestId: (id: number) => void;
  table: Table<HttpRequest>;
};

function HistoryTable({
  selectedRequestId,
  setSelectedRequestId,
  table,
}: HistoryTableProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 36,
    getScrollElement: () => scrollRef.current,
    overscan: 8,
  });

  return (
    <section className="history-table" ref={scrollRef} aria-label="HTTP history">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody
          style={{
            height: `${virtualizer.getTotalSize()}px`,
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];

            return (
              <HistoryRow
                key={row.id}
                row={row}
                selectedRequestId={selectedRequestId}
                setSelectedRequestId={setSelectedRequestId}
                start={virtualRow.start}
              />
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

type HistoryRowProps = {
  row: Row<HttpRequest>;
  selectedRequestId: number;
  setSelectedRequestId: (id: number) => void;
  start: number;
};

function HistoryRow({
  row,
  selectedRequestId,
  setSelectedRequestId,
  start,
}: HistoryRowProps) {
  return (
    <tr
      className={row.original.id === selectedRequestId ? "history-row selected" : "history-row"}
      onClick={() => setSelectedRequestId(row.original.id)}
      style={{
        transform: `translateY(${start}px)`,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

type EditorPaneProps = {
  editable?: boolean;
  modes: EditorMode[];
  onChange?: (value: string) => void;
  selectedMode: EditorMode;
  setSelectedMode: (mode: EditorMode) => void;
  text: string;
  title: string;
};

function EditorPane({
  editable = false,
  modes,
  onChange,
  selectedMode,
  setSelectedMode,
  text,
  title,
}: EditorPaneProps) {
  return (
    <article className="editor-pane">
      <div className="editor-toolbar">
        <strong>{title}</strong>
        <Tabs
          onValueChange={(mode) => setSelectedMode(mode as EditorMode)}
          value={selectedMode}
        >
          <TabsList className="editor-tabs" variant="line">
            {modes.map((mode) => (
              <TabsTrigger key={mode} value={mode}>
                {mode}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <Suspense
        fallback={<div className="code-view code-loading">Loading editor...</div>}
      >
        <CodeEditor
          editable={editable}
          mode={selectedMode}
          onChange={onChange}
          text={text}
        />
      </Suspense>
    </article>
  );
}

type RepeaterWorkspaceProps = {
  editorModes: EditorMode[];
  items: RepeaterItem[];
  onRequestChange: (value: string) => void;
  onSend: () => void;
  requestMode: EditorMode;
  responseMode: EditorMode;
  selectedItem: RepeaterItem;
  selectedItemId: string;
  setRequestMode: (mode: EditorMode) => void;
  setResponseMode: (mode: EditorMode) => void;
  setSelectedItemId: (id: string) => void;
};

function RepeaterWorkspace({
  editorModes,
  items,
  onRequestChange,
  onSend,
  requestMode,
  responseMode,
  selectedItem,
  selectedItemId,
  setRequestMode,
  setResponseMode,
  setSelectedItemId,
}: RepeaterWorkspaceProps) {
  return (
    <Group className="workspace repeater-workspace" id="flexkit-repeater" orientation="horizontal">
      <Panel className="repeater-list-panel panel" defaultSize="20%" id="repeater-list" minSize="16%">
        <aside className="panel-fill">
          <div className="panel-header">
            <strong>Repeater</strong>
              <Button className="chrome-button" size="xs" variant="ghost">
                New
              </Button>
          </div>
          <div className="repeater-list">
            {items.map((item) => (
              <Button
                className={
                  item.id === selectedItemId
                    ? "repeater-item selected"
                    : "repeater-item"
                }
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                variant="ghost"
              >
                <span>
                  <strong>{item.name}</strong>
                  <code>{item.target}</code>
                </span>
                <Badge
                  className={`risk ${
                    item.status >= 300 ? "risk-medium" : "risk-low"
                  }`}
                  variant="outline"
                >
                  {item.status}
                </Badge>
              </Button>
            ))}
          </div>
        </aside>
      </Panel>

      <Separator className="resize-handle vertical" />

      <Panel className="repeater-main-panel" defaultSize="55%" id="repeater-main" minSize="38%">
        <section className="repeater-main">
          <div className="repeater-toolbar">
            <Badge className="method-badge" variant="outline">
              {selectedItem.method}
            </Badge>
            <Input value={selectedItem.target} readOnly />
            <Button className="workbench-button primary-action" onClick={onSend} size="sm">
              Send
            </Button>
          </div>

          <Group className="editors" orientation="horizontal">
            <Panel defaultSize="50%" id="repeater-request" minSize="32%">
              <EditorPane
                editable
                modes={editorModes}
                onChange={onRequestChange}
                selectedMode={requestMode}
                setSelectedMode={setRequestMode}
                text={selectedItem.request}
                title="Request"
              />
            </Panel>
            <Separator className="resize-handle vertical" />
            <Panel defaultSize="50%" id="repeater-response" minSize="32%">
              <EditorPane
                modes={editorModes}
                selectedMode={responseMode}
                setSelectedMode={setResponseMode}
                text={selectedItem.response}
                title="Response"
              />
            </Panel>
          </Group>
        </section>
      </Panel>

      <Separator className="resize-handle vertical inspector-resize" />

      <Panel className="repeater-inspector-panel panel" defaultSize="25%" id="repeater-inspector" minSize="18%">
        <aside className="panel-fill">
          <div className="panel-header">
            <strong>Run details</strong>
            <span>{selectedItem.lastRun}</span>
          </div>
          <div className="inspector-content">
            <article className="metric-card">
              <span>Status</span>
              <strong>{selectedItem.status}</strong>
            </article>
            <article className="metric-card">
              <span>Round trip</span>
              <strong>{selectedItem.time}</strong>
            </article>
            <article className="finding-card">
              <div>
                <Badge
                  className={`risk ${
                    selectedItem.status >= 300 ? "risk-medium" : "risk-low"
                  }`}
                  variant="outline"
                >
                  Mock
                </Badge>
                <strong>Replay result</strong>
              </div>
              <p>
                Send updates this panel with a deterministic mock response. No live
                traffic leaves the app.
              </p>
            </article>
          </div>
        </aside>
      </Panel>
    </Group>
  );
}

function InspectorContent({
  request,
  tab,
}: {
  request: HttpRequest;
  tab: InspectorTab;
}) {
  if (tab === "Issues") {
    return (
      <div className="inspector-content">
        <article className="finding-card">
          <div>
            <Badge
              className={`risk risk-${request.risk.toLowerCase()}`}
              variant="outline"
            >
              {request.risk}
            </Badge>
            <strong>{request.issue.title}</strong>
          </div>
          <p>{request.issue.description}</p>
        </article>
        <article className="metric-card">
          <span>Response status</span>
          <strong>{request.status}</strong>
        </article>
        <article className="metric-card">
          <span>Round trip</span>
          <strong>{request.time}</strong>
        </article>
      </div>
    );
  }

  const rows =
    tab === "Headers"
      ? request.headers
      : tab === "Params"
        ? request.params
        : request.cookies;

  return (
    <div className="inspector-content">
      {rows.length > 0 ? (
        rows.map(([name, value]) => (
          <div className="kv-row" key={name}>
            <span>{name}</span>
            <code>{value}</code>
          </div>
        ))
      ) : (
        <div className="empty-state">No {tab.toLowerCase()} captured.</div>
      )}
    </div>
  );
}

export default App;
