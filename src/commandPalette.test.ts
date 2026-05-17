import { expect, test } from "bun:test";
import { isCommandPaletteShortcut } from "./commandPaletteModel";

test("detects command palette keyboard shortcut", () => {
  expect(
    isCommandPaletteShortcut({
      ctrlKey: false,
      key: "P",
      metaKey: true,
      shiftKey: true,
    }),
  ).toBe(true);
  expect(
    isCommandPaletteShortcut({
      ctrlKey: true,
      key: "p",
      metaKey: false,
      shiftKey: true,
    }),
  ).toBe(true);
});

test("ignores similar non-command-palette shortcuts", () => {
  expect(
    isCommandPaletteShortcut({
      ctrlKey: false,
      key: "p",
      metaKey: true,
      shiftKey: false,
    }),
  ).toBe(false);
  expect(
    isCommandPaletteShortcut({
      ctrlKey: false,
      key: "P",
      metaKey: false,
      shiftKey: true,
    }),
  ).toBe(false);
});
