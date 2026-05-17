export type CommandPaletteKeyboardEvent = Pick<
  KeyboardEvent,
  "ctrlKey" | "key" | "metaKey" | "shiftKey"
>;

export type CommandPaletteCommand = {
  group: string;
  id: string;
  keywords?: string[];
  perform: () => void;
  shortcut?: string;
  subtitle?: string;
  title: string;
};

export function isCommandPaletteShortcut(event: CommandPaletteKeyboardEvent) {
  return (
    (event.metaKey || event.ctrlKey) &&
    event.shiftKey &&
    event.key.toLowerCase() === "p"
  );
}
