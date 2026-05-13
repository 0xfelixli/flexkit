import { expect, test } from "bun:test";
import { formatEditorText } from "./editorFormatting";

test("formats editor text as lowercase hex bytes", () => {
  expect(formatEditorText("GET", "Hex")).toBe("47 45 54");
});

test("keeps editor text unchanged outside hex mode", () => {
  expect(formatEditorText("HTTP/1.1 200 OK", "Raw")).toBe("HTTP/1.1 200 OK");
});
