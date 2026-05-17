import { memo } from "react";
import { Clipboard, Copy, Plus, Repeat2, Send } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { EditorPane } from "./EditorPane";
import { type EditorMode, type RepeaterItem } from "./types";

type RepeaterWorkspaceProps = {
  editorModes: EditorMode[];
  items: RepeaterItem[];
  onCopy: (value: string) => void;
  onCopyTarget: (item: RepeaterItem) => void;
  onDuplicateItem: (item: RepeaterItem) => void;
  onNewItem: () => void;
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

export const RepeaterWorkspace = memo(function RepeaterWorkspace({
  editorModes,
  items,
  onCopy,
  onCopyTarget,
  onDuplicateItem,
  onNewItem,
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
    <Group
      className="workspace repeater-workspace"
      id="flexkit-repeater"
      orientation="horizontal"
    >
      <Panel
        className="repeater-list-panel panel"
        defaultSize="20%"
        id="repeater-list"
        minSize="16%"
      >
        <aside className="panel-fill">
          <div className="panel-header">
            <strong>Repeater</strong>
            <Button
              className="chrome-button"
              onClick={onNewItem}
              size="xs"
              variant="ghost"
            >
              <Plus data-icon="inline-start" />
              New
            </Button>
          </div>
          <div className="repeater-list">
            {items.length === 0 ? (
              <div className="repeater-empty">
                <strong>Empty</strong>
                No requests.
              </div>
            ) : null}
            {items.map((item) => (
              <ContextMenu key={item.id}>
                <ContextMenuTrigger asChild>
                  <Button
                    className={
                      item.id === selectedItemId
                        ? "repeater-item selected"
                        : "repeater-item"
                    }
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
                </ContextMenuTrigger>
                <ContextMenuContent className="workbench-context-menu">
                  <ContextMenuItem onSelect={() => setSelectedItemId(item.id)}>
                    <Repeat2 />
                    Open request
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => onDuplicateItem(item)}>
                    <Copy />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => onCopyTarget(item)}>
                    <Clipboard />
                    Copy target
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </aside>
      </Panel>

      <Separator className="resize-handle vertical" />

      <Panel
        className="repeater-main-panel"
        defaultSize="55%"
        id="repeater-main"
        minSize="38%"
      >
        <section className="repeater-main">
          <div className="repeater-toolbar">
            <Badge className="method-badge" variant="outline">
              {selectedItem.method}
            </Badge>
            <Input
              className="target-input"
              value={selectedItem.target}
              readOnly
            />
            <Button
              className="workbench-button primary-action"
              onClick={onSend}
              size="sm"
            >
              <Send data-icon="inline-start" />
              Send
            </Button>
          </div>

          <Group className="editors" orientation="horizontal">
            <Panel defaultSize="50%" id="repeater-request" minSize="32%">
              <EditorPane
                editable
                modes={editorModes}
                onChange={onRequestChange}
                onCopy={onCopy}
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
                onCopy={onCopy}
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

      <Panel
        className="repeater-inspector-panel panel"
        defaultSize="25%"
        id="repeater-inspector"
        minSize="18%"
      >
        <aside className="panel-fill">
          <div className="panel-header">
            <strong>Run</strong>
            <span>{selectedItem.lastRun}</span>
          </div>
          <div className="inspector-content">
            <section className="inspector-section">
              <div className="section-title">Summary</div>
              <div className="property-list">
                <div className="property-row">
                  <span>Status</span>
                  <strong>{selectedItem.status}</strong>
                </div>
                <div className="property-row">
                  <span>Latency</span>
                  <strong>{selectedItem.time}</strong>
                </div>
                <div className="property-row">
                  <span>Last run</span>
                  <code>{selectedItem.lastRun}</code>
                </div>
              </div>
            </section>
            <section className="finding-panel">
              <div>
                <Badge
                  className={`risk ${
                    selectedItem.status >= 300 ? "risk-medium" : "risk-low"
                  }`}
                  variant="outline"
                >
                  Replay
                </Badge>
                <strong>Response details</strong>
              </div>
              <p>Local deterministic response.</p>
            </section>
          </div>
        </aside>
      </Panel>
    </Group>
  );
});
