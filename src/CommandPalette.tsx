import { memo, useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import {
  type CommandPaletteCommand,
  isCommandPaletteShortcut,
} from "./commandPaletteModel";

type CommandPaletteProps = {
  commands: CommandPaletteCommand[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export const CommandPalette = memo(function CommandPalette({
  commands,
  onOpenChange,
  open,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isCommandPaletteShortcut(event)) {
        return;
      }

      event.preventDefault();
      onOpenChange(true);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const groups = useMemo(() => {
    const nextGroups = new Map<string, CommandPaletteCommand[]>();

    for (const command of commands) {
      const group = nextGroups.get(command.group) ?? [];
      group.push(command);
      nextGroups.set(command.group, group);
    }

    return [...nextGroups.entries()];
  }, [commands]);

  function runCommand(command: CommandPaletteCommand) {
    command.perform();
    onOpenChange(false);
  }

  return (
    <Command.Dialog
      className="command-palette"
      label="Command palette"
      loop
      onOpenChange={onOpenChange}
      open={open}
    >
      <div className="command-palette-input-row">
        <Command.Input
          autoFocus
          className="command-palette-input"
          onValueChange={setSearch}
          placeholder="Type a command"
          value={search}
        />
        <kbd>⌘⇧P</kbd>
      </div>
      <Command.List className="command-palette-list">
        <Command.Empty className="command-palette-empty">
          No commands
        </Command.Empty>
        {groups.map(([group, groupCommands]) => (
          <Command.Group
            className="command-palette-group"
            heading={group}
            key={group}
          >
            {groupCommands.map((command) => (
              <Command.Item
                className="command-palette-item"
                key={command.id}
                keywords={command.keywords}
                onSelect={() => runCommand(command)}
                value={`${command.title} ${command.subtitle ?? ""}`}
              >
                <span>
                  <strong>{command.title}</strong>
                  {command.subtitle ? <small>{command.subtitle}</small> : null}
                </span>
                {command.shortcut ? <kbd>{command.shortcut}</kbd> : null}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
      <div className="command-palette-footer">
        <span>{commands.length} commands</span>
        <span>
          <kbd>↑↓</kbd> Navigate <kbd>Enter</kbd> Run <kbd>Esc</kbd> Close
        </span>
      </div>
    </Command.Dialog>
  );
});
