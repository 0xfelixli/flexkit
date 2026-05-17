import { memo, useMemo } from "react";
import { json } from "@codemirror/lang-json";
import { search, searchKeymap } from "@codemirror/search";
import { keymap } from "@codemirror/view";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import CodeMirror from "@uiw/react-codemirror";
import { type EditorMode, formatEditorText } from "./editorFormatting";

type CodeEditorProps = {
  editable?: boolean;
  onChange?: (value: string) => void;
  mode: EditorMode;
  text: string;
};

const codeEditorBasicSetup = {
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  lineNumbers: true,
};

function CodeEditor({ editable = false, mode, onChange, text }: CodeEditorProps) {
  const extensions = useMemo(
    () => [
      search(),
      keymap.of(searchKeymap),
      ...(mode === "Hex" ? [] : [json()]),
    ],
    [mode],
  );

  return (
    <CodeMirror
      basicSetup={codeEditorBasicSetup}
      className="code-view"
      editable={editable}
      extensions={extensions}
      height="100%"
      onChange={onChange}
      theme={vscodeLight}
      value={formatEditorText(text, mode)}
    />
  );
}

export default memo(CodeEditor);
