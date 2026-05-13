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

function CodeEditor({ editable = false, mode, onChange, text }: CodeEditorProps) {
  return (
    <CodeMirror
      basicSetup={{
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
        lineNumbers: true,
      }}
      className="code-view"
      editable={editable}
      extensions={[
        search(),
        keymap.of(searchKeymap),
        ...(mode === "Hex" ? [] : [json()]),
      ]}
      height="100%"
      onChange={onChange}
      theme={vscodeLight}
      value={formatEditorText(text, mode)}
    />
  );
}

export default CodeEditor;
