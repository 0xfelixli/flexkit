export type EditorMode = "Pretty" | "Raw" | "Hex";

export function formatEditorText(text: string, mode: EditorMode) {
  if (mode === "Hex") {
    return Array.from(text.slice(0, 120))
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(" ");
  }

  return text;
}
