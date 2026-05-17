import { useEffect } from "react";

function canScrollVertically(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;

  return (
    (overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay") &&
    element.scrollHeight > element.clientHeight
  );
}

function findVerticalScroller(target: EventTarget | null) {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== document.body) {
    if (canScrollVertically(element)) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
}

function isAtScrollBoundary(element: HTMLElement, deltaY: number) {
  if (deltaY === 0) {
    return false;
  }

  const maxScrollTop = element.scrollHeight - element.clientHeight;

  return deltaY < 0
    ? element.scrollTop <= 0
    : element.scrollTop >= maxScrollTop - 1;
}

export function useDesktopShellBehavior() {
  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      if (event.defaultPrevented || event.ctrlKey) {
        return;
      }

      const scroller = findVerticalScroller(event.target);

      if (!scroller || isAtScrollBoundary(scroller, event.deltaY)) {
        event.preventDefault();
      }
    }

    function handleContextMenu(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const allowNativeMenu = target.closest(
        "input, textarea, [contenteditable='true'], .cm-editor, .cm-content, .history-table, [role='textbox']",
      );

      if (allowNativeMenu) {
        return;
      }

      event.preventDefault();
    }

    document.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("wheel", handleWheel, {
        capture: true,
      });
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
}
