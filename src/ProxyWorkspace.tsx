import { memo } from "react";
import { type Table } from "@tanstack/react-table";
import { Filter, PanelRightClose, PanelRightOpen, Search } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorPane } from "./EditorPane";
import { HistoryTable } from "./HttpHistoryTable";
import { InspectorContent } from "./InspectorContent";
import { type EditorMode, type HttpRequest, type InspectorTab } from "./types";

type ProxyWorkspaceProps = {
  editorModes: EditorMode[];
  filterChips: string[];
  inspectorCollapsed: boolean;
  inspectorTab: InspectorTab;
  inspectorTabs: InspectorTab[];
  onCopy: (value: string) => void;
  onCopyRequest: (request: HttpRequest) => void;
  onCopyResponse: (request: HttpRequest) => void;
  onCopyUrl: (request: HttpRequest) => void;
  onSendToRepeater: (request: HttpRequest) => void;
  onShowHeaders: (request: HttpRequest) => void;
  requestMode: EditorMode;
  responseMode: EditorMode;
  selectedRequest: HttpRequest;
  setInspectorCollapsed: (collapsed: boolean) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  setRequestMode: (mode: EditorMode) => void;
  setResponseMode: (mode: EditorMode) => void;
  setSelectedRequestId: (id: number) => void;
  table: Table<HttpRequest>;
};

export const ProxyWorkspace = memo(function ProxyWorkspace({
  editorModes,
  filterChips,
  inspectorCollapsed,
  inspectorTab,
  inspectorTabs,
  onCopy,
  onCopyRequest,
  onCopyResponse,
  onCopyUrl,
  onSendToRepeater,
  onShowHeaders,
  requestMode,
  responseMode,
  selectedRequest,
  setInspectorCollapsed,
  setInspectorTab,
  setRequestMode,
  setResponseMode,
  setSelectedRequestId,
  table,
}: ProxyWorkspaceProps) {
  return (
    <Group
      className="workspace"
      id="flexkit-workspace"
      orientation="horizontal"
    >
      <Panel
        className="scope-panel panel"
        defaultSize="16%"
        id="scope"
        minSize="12%"
      >
        <aside className="panel-fill">
          <div className="panel-header">
            <strong>Scope</strong>
            <Button className="chrome-button" size="xs" variant="ghost">
              <Filter data-icon="inline-start" />
              Scope filter
            </Button>
          </div>
          <div className="tree">
            <div className="tree-row strong">▾ app.local</div>
            <div className="tree-row indent-1">▾ /api</div>
            <Button
              className="tree-row indent-2 selected"
              size="xs"
              variant="ghost"
            >
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
        defaultSize={inspectorCollapsed ? "80%" : "60%"}
        id="traffic"
        minSize="38%"
      >
        <section className="traffic-panel-fill">
          <div className="filter-bar">
            {filterChips.map((chip) => (
              <Button
                className={
                  chip === "In scope"
                    ? "workbench-button filter-chip active"
                    : "workbench-button filter-chip"
                }
                key={chip}
                size="sm"
                variant="outline"
              >
                {chip}
              </Button>
            ))}
            <label className="request-search">
              <span className="request-search-label">
                <Search aria-hidden="true" />
                Search
              </span>
              <Input
                className="request-search-input"
                placeholder="Filter by host, path, method..."
              />
            </label>
          </div>

          <Group className="traffic-split" orientation="vertical">
            <Panel defaultSize="48%" id="history" minSize="30%">
              <HistoryTable
                onCopyRequest={onCopyRequest}
                onCopyResponse={onCopyResponse}
                onCopyUrl={onCopyUrl}
                onSendToRepeater={onSendToRepeater}
                onShowHeaders={onShowHeaders}
                selectedRequestId={selectedRequest.id}
                setSelectedRequestId={setSelectedRequestId}
                table={table}
              />
            </Panel>
            <Separator className="resize-handle horizontal" />
            <Panel defaultSize="52%" id="editors" minSize="34%">
              <Group className="editors" orientation="horizontal">
                <Panel defaultSize="50%" id="request-editor" minSize="28%">
                  <EditorPane
                    modes={editorModes}
                    onCopy={onCopy}
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
                    onCopy={onCopy}
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
        className={
          inspectorCollapsed
            ? "inspector-panel panel inspector-panel-collapsed"
            : "inspector-panel panel"
        }
        defaultSize={inspectorCollapsed ? "4%" : "24%"}
        id="inspector"
        maxSize={inspectorCollapsed ? "4%" : "32%"}
        minSize={inspectorCollapsed ? "4%" : "18%"}
      >
        {inspectorCollapsed ? (
          <aside className="inspector-rail">
            <Button
              aria-label="Expand inspector"
              className="chrome-button inspector-toggle"
              onClick={() => setInspectorCollapsed(false)}
              size="icon-xs"
              variant="ghost"
            >
              <PanelRightOpen />
            </Button>
            <span>Inspector</span>
          </aside>
        ) : (
          <aside className="panel-fill">
            <div className="panel-header inspector-header">
              <div>
                <strong>Inspector</strong>
                <span>{selectedRequest.host}</span>
              </div>
              <Button
                aria-label="Collapse inspector"
                className="chrome-button inspector-toggle"
                onClick={() => setInspectorCollapsed(true)}
                size="icon-xs"
                variant="ghost"
              >
                <PanelRightClose />
              </Button>
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
        )}
      </Panel>
    </Group>
  );
});
