import { lazy, memo, Suspense } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type EditorMode } from "./types";

const CodeEditor = lazy(() => import("./CodeEditor"));

type EditorPaneProps = {
  editable?: boolean;
  modes: EditorMode[];
  onChange?: (value: string) => void;
  onCopy: (value: string) => void;
  selectedMode: EditorMode;
  setSelectedMode: (mode: EditorMode) => void;
  text: string;
  title: string;
};

export const EditorPane = memo(function EditorPane({
  editable = false,
  modes,
  onChange,
  onCopy,
  selectedMode,
  setSelectedMode,
  text,
  title,
}: EditorPaneProps) {
  return (
    <article className="editor-pane">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
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
        <div className="editor-toolbar-actions">
          <span className={editable ? "editor-state dirty" : "editor-state"}>
            {editable ? "Editable" : "Read only"}
          </span>
          <Button
            aria-label={`Copy ${title.toLowerCase()}`}
            className="chrome-button"
            onClick={() => onCopy(text)}
            size="icon-xs"
            variant="ghost"
          >
            <Copy />
          </Button>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="code-view code-loading">Loading editor...</div>
        }
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
});
