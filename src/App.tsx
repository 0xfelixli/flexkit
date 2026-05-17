import { useCallback, useMemo, useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  CirclePause,
  Copy,
  Plus,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommandPalette } from "./CommandPalette";
import { historyColumns } from "./HttpHistoryTable";
import { ModulePlaceholder } from "./ModulePlaceholder";
import { ProxyWorkspace } from "./ProxyWorkspace";
import { RepeaterWorkspace } from "./RepeaterWorkspace";
import {
  editorModes,
  filterChips,
  inspectorTabs,
  modules,
  proxyTabs,
  repeaterSeeds,
  requests,
} from "./mockData";
import { createReplayResult } from "./repeater";
import {
  type EditorMode,
  type HttpRequest,
  type InspectorTab,
  type ProxyTab,
  type RepeaterItem,
} from "./types";
import { useDesktopShellBehavior } from "./hooks/useDesktopShellBehavior";
import { type CommandPaletteCommand } from "./commandPaletteModel";
import "./App.css";

const requestTableCoreRowModel = getCoreRowModel<HttpRequest>();

function copyToClipboard(value: string) {
  void navigator.clipboard?.writeText(value);
}

function getRequestUrl(request: HttpRequest) {
  return `https://${request.host}${request.path}`;
}

function createDraftRepeaterItem(): RepeaterItem {
  return {
    id: `rep-new-${Date.now()}`,
    name: "Untitled request",
    method: "GET",
    target: "https://app.local/",
    request: "GET / HTTP/1.1\nHost: app.local\nAccept: */*",
    response: "HTTP/1.1 204 No Content",
    status: 204,
    time: "0 ms",
    lastRun: "Draft",
  };
}

function App() {
  useDesktopShellBehavior();

  const [activeModule, setActiveModule] = useState("Proxy");
  const [activeProxyTab, setActiveProxyTab] =
    useState<ProxyTab>("HTTP History");
  const [selectedRequestId, setSelectedRequestId] = useState(requests[0].id);
  const [requestMode, setRequestMode] = useState<EditorMode>("Pretty");
  const [responseMode, setResponseMode] = useState<EditorMode>("Pretty");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("Issues");
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [repeaterItems, setRepeaterItems] = useState(repeaterSeeds);
  const [selectedRepeaterId, setSelectedRepeaterId] = useState(
    repeaterSeeds[0].id,
  );
  const [repeaterRequestMode, setRepeaterRequestMode] =
    useState<EditorMode>("Pretty");
  const [repeaterResponseMode, setRepeaterResponseMode] =
    useState<EditorMode>("Pretty");
  const [replaySequence, setReplaySequence] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const selectedRequest = useMemo(
    () =>
      requests.find((request) => request.id === selectedRequestId) ??
      requests[0],
    [selectedRequestId],
  );
  const table = useReactTable({
    columns: historyColumns,
    data: requests,
    getCoreRowModel: requestTableCoreRowModel,
  });
  const selectedRepeater = useMemo(
    () =>
      repeaterItems.find((item) => item.id === selectedRepeaterId) ??
      repeaterItems[0],
    [repeaterItems, selectedRepeaterId],
  );

  const updateRepeaterRequest = useCallback((requestText: string) => {
    setRepeaterItems((items) =>
      items.map((item) =>
        item.id === selectedRepeater.id
          ? { ...item, request: requestText }
          : item,
      ),
    );
  }, [selectedRepeater.id]);

  const sendRepeaterRequest = useCallback(() => {
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
  }, [replaySequence, selectedRepeater.id, selectedRepeater.request]);

  const sendHistoryToRepeater = useCallback((request: HttpRequest) => {
    const nextItem: RepeaterItem = {
      id: `rep-${request.id}`,
      name: `${request.method} ${request.path}`,
      method: request.method,
      target: getRequestUrl(request),
      request: request.request,
      response: request.response,
      status: request.status,
      time: request.time,
      lastRun: "From history",
    };

    setRepeaterItems((items) => {
      const exists = items.some((item) => item.id === nextItem.id);

      return exists
        ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
        : [nextItem, ...items];
    });
    setSelectedRepeaterId(nextItem.id);
    setActiveModule("Repeater");
  }, []);

  const addRepeaterItem = useCallback((item: RepeaterItem) => {
    setRepeaterItems((items) => [item, ...items]);
    setSelectedRepeaterId(item.id);
    setActiveModule("Repeater");
  }, []);

  const createRepeaterTab = useCallback(() => {
    addRepeaterItem(createDraftRepeaterItem());
  }, [addRepeaterItem]);

  const duplicateRepeaterItem = useCallback(
    (item: RepeaterItem) => {
      addRepeaterItem({
        ...item,
        id: `${item.id}-copy-${Date.now()}`,
        name: `${item.name} copy`,
        lastRun: "Duplicated",
      });
    },
    [addRepeaterItem],
  );

  const closeRepeaterItem = useCallback((id: string) => {
    setRepeaterItems((items) => {
      if (items.length <= 1) {
        const draft = createDraftRepeaterItem();
        setSelectedRepeaterId(draft.id);
        return [draft];
      }

      const nextItems = items.filter((item) => item.id !== id);

      setSelectedRepeaterId((currentSelectedId) =>
        currentSelectedId === id ? (nextItems[0]?.id ?? items[0].id) : currentSelectedId,
      );

      return nextItems;
    });
  }, []);

  const copyRequest = useCallback(
    (request: HttpRequest) => copyToClipboard(request.request),
    [],
  );
  const copyResponse = useCallback(
    (request: HttpRequest) => copyToClipboard(request.response),
    [],
  );
  const copyUrl = useCallback(
    (request: HttpRequest) => copyToClipboard(getRequestUrl(request)),
    [],
  );
  const copyRepeaterTarget = useCallback(
    (item: RepeaterItem) => copyToClipboard(item.target),
    [],
  );
  const showRequestHeaders = useCallback((request: HttpRequest) => {
    setSelectedRequestId(request.id);
    setInspectorCollapsed(false);
    setInspectorTab("Headers");
  }, []);

  const openProxyHeaders = useCallback(() => {
    setActiveModule("Proxy");
    setActiveProxyTab("HTTP History");
    showRequestHeaders(selectedRequest);
  }, [selectedRequest, showRequestHeaders]);

  const toggleInspector = useCallback(() => {
    setActiveModule("Proxy");
    setInspectorCollapsed((collapsed) => !collapsed);
  }, []);

  const commandPaletteCommands = useMemo<CommandPaletteCommand[]>(
    () => [
      ...modules.map((module) => ({
        group: "Navigation",
        id: `go-${module.toLowerCase()}`,
        keywords: ["module", module.toLowerCase()],
        perform: () => setActiveModule(module),
        subtitle: "Switch module",
        title: `Go to ${module}`,
      })),
      {
        group: "Proxy",
        id: "proxy-http-history",
        keywords: ["history", "requests", "traffic"],
        perform: () => {
          setActiveModule("Proxy");
          setActiveProxyTab("HTTP History");
        },
        subtitle: "Open proxy history",
        title: "Show HTTP History",
      },
      {
        group: "Proxy",
        id: "proxy-headers",
        keywords: ["headers", selectedRequest.host],
        perform: openProxyHeaders,
        subtitle: selectedRequest.host,
        title: "Show Request Headers",
      },
      {
        group: "Proxy",
        id: "proxy-toggle-inspector",
        keywords: ["inspector", "sidebar", "details"],
        perform: toggleInspector,
        title: "Toggle Inspector",
      },
      {
        group: "Repeater",
        id: "repeater-new",
        keywords: ["replay", "request", "tab"],
        perform: createRepeaterTab,
        shortcut: "⌘N",
        title: "New Repeater Tab",
      },
      {
        group: "Repeater",
        id: "repeater-send",
        keywords: ["run", "replay"],
        perform: sendRepeaterRequest,
        shortcut: "⌘↵",
        subtitle: selectedRepeater.name,
        title: "Send Repeater Request",
      },
      {
        group: "Repeater",
        id: "repeater-duplicate",
        keywords: ["copy", "clone"],
        perform: () => duplicateRepeaterItem(selectedRepeater),
        subtitle: selectedRepeater.name,
        title: "Duplicate Repeater Tab",
      },
      {
        group: "Clipboard",
        id: "copy-url",
        keywords: ["copy", "url", selectedRequest.host],
        perform: () => copyUrl(selectedRequest),
        subtitle: getRequestUrl(selectedRequest),
        title: "Copy Selected URL",
      },
      {
        group: "Clipboard",
        id: "copy-repeater-target",
        keywords: ["copy", "target", selectedRepeater.target],
        perform: () => copyRepeaterTarget(selectedRepeater),
        subtitle: selectedRepeater.target,
        title: "Copy Repeater Target",
      },
    ],
    [
      copyRepeaterTarget,
      copyUrl,
      createRepeaterTab,
      duplicateRepeaterItem,
      openProxyHeaders,
      selectedRepeater,
      selectedRequest,
      sendRepeaterRequest,
      toggleInspector,
    ],
  );

  function renderModuleActions() {
    if (activeModule === "Proxy") {
      return (
        <Button
          className="workbench-button secondary-action"
          size="sm"
          variant="outline"
        >
          <CirclePause data-icon="inline-start" />
          Intercept off
        </Button>
      );
    }

    if (activeModule === "Repeater") {
      return (
        <>
          <Button
            className="workbench-button primary-action"
            onClick={sendRepeaterRequest}
            size="sm"
          >
            <Send data-icon="inline-start" />
            Send
          </Button>
          <Button
            className="workbench-button secondary-action"
            onClick={createRepeaterTab}
            size="sm"
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            New
          </Button>
          <Button
            className="workbench-button secondary-action"
            onClick={() => duplicateRepeaterItem(selectedRepeater)}
            size="sm"
            variant="outline"
          >
            <Copy data-icon="inline-start" />
            Duplicate
          </Button>
        </>
      );
    }

    return <span className="module-action-note">idle</span>;
  }

  return (
    <main className="app-shell">
      <header className="menu-bar">
        <div className="brand-cluster">
          <div className="brand-mark">F</div>
          <strong>FlexKit</strong>
          <Tabs
            className="main-tabs-wrapper"
            onValueChange={setActiveModule}
            value={activeModule}
          >
            <TabsList className="main-tabs" variant="line">
              {modules.map((module) => (
                <TabsTrigger className="main-tab" key={module} value={module}>
                  {module}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="top-actions">
          <div className="module-actions">{renderModuleActions()}</div>
          <div className="session-state">
            <span className="status-dot" />
            <span>Session active</span>
          </div>
        </div>
      </header>

      <section className="context-bar" aria-label="Module context">
        {activeModule === "Proxy" ? (
          <>
            <Tabs
              className="proxy-tabs-wrapper"
              onValueChange={(tab) => setActiveProxyTab(tab as ProxyTab)}
              value={activeProxyTab}
            >
              <TabsList className="proxy-tabs" variant="line">
                {proxyTabs.map((tab) => (
                  <TabsTrigger className="proxy-tab" key={tab} value={tab}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="context-meta">
              <span>filtered</span>
              <span>127.0.0.1:8080</span>
            </div>
          </>
        ) : activeModule === "Repeater" ? (
          <>
            <div
              className="replay-tabs"
              role="tablist"
              aria-label="Replay tabs"
            >
              {repeaterItems.map((item) => (
                <div
                  className={
                    item.id === selectedRepeater.id
                      ? "replay-tab selected"
                      : "replay-tab"
                  }
                  key={item.id}
                >
                  <Button
                    className="replay-tab-trigger"
                    onClick={() => setSelectedRepeaterId(item.id)}
                    size="xs"
                    variant="ghost"
                  >
                    {item.name}
                  </Button>
                  <Button
                    aria-label={`Close ${item.name}`}
                    className="replay-tab-close"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeRepeaterItem(item.id);
                    }}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <X />
                  </Button>
                </div>
              ))}
              <Button
                className="replay-tab replay-tab-add"
                onClick={createRepeaterTab}
                size="xs"
                variant="ghost"
              >
                <Plus data-icon="inline-start" />
              </Button>
            </div>
            <div className="context-meta">
              <span>{selectedRepeater.method}</span>
              <span>
                {selectedRepeater.status} · {selectedRepeater.time}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="context-placeholder">{activeModule}</div>
            <div className="context-meta">
              <span>idle</span>
            </div>
          </>
        )}
      </section>

      {activeModule === "Repeater" ? (
        <RepeaterWorkspace
          editorModes={editorModes}
          items={repeaterItems}
          onCopy={copyToClipboard}
          onCopyTarget={copyRepeaterTarget}
          onDuplicateItem={duplicateRepeaterItem}
          onNewItem={createRepeaterTab}
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
      ) : activeModule === "Proxy" ? (
        <ProxyWorkspace
          editorModes={editorModes}
          filterChips={filterChips}
          inspectorCollapsed={inspectorCollapsed}
          inspectorTab={inspectorTab}
          inspectorTabs={inspectorTabs}
          onCopy={copyToClipboard}
          onCopyRequest={copyRequest}
          onCopyResponse={copyResponse}
          onCopyUrl={copyUrl}
          onSendToRepeater={sendHistoryToRepeater}
          onShowHeaders={showRequestHeaders}
          requestMode={requestMode}
          responseMode={responseMode}
          selectedRequest={selectedRequest}
          setInspectorCollapsed={setInspectorCollapsed}
          setInspectorTab={setInspectorTab}
          setRequestMode={setRequestMode}
          setResponseMode={setResponseMode}
          setSelectedRequestId={setSelectedRequestId}
          table={table}
        />
      ) : (
        <ModulePlaceholder module={activeModule} />
      )}

      <footer className="status-bar">
        {activeModule === "Proxy" ? (
          <span>
            {requests.length} requests · 3 in scope · {selectedRequest.id}{" "}
            selected
          </span>
        ) : activeModule === "Repeater" ? (
          <span>
            {repeaterItems.length} tabs · {selectedRepeater.name} selected
          </span>
        ) : (
          <span>{activeModule} · no source</span>
        )}
        <span>local</span>
      </footer>
      <CommandPalette
        commands={commandPaletteCommands}
        onOpenChange={setCommandPaletteOpen}
        open={commandPaletteOpen}
      />
    </main>
  );
}

export default App;
