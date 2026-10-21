import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  SIDEBAR_WIDTH_DEFAULT,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN
} from "@/lib/stores/ui-store";

export function useSidebarResize(
  collapsed: boolean,
  sidebarWidth: number,
  onSidebarWidthChange?: (width: number) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number; pointerId: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (collapsed) return;
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      dragRef.current = { startX: e.clientX, startWidth: sidebarWidth, pointerId: e.pointerId };
      setIsDragging(true);
    },
    [collapsed, sidebarWidth]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      const next = Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, dragRef.current.startWidth + delta));
      onSidebarWidthChange?.(next);
    },
    [onSidebarWidthChange]
  );

  const handlePointerUp = useCallback(
    (e?: React.PointerEvent) => {
      const drag = dragRef.current;
      if (drag && e && (e.currentTarget as HTMLElement).hasPointerCapture?.(drag.pointerId)) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(drag.pointerId);
        } catch {
          // capture may already be released on cancel; ignore
        }
      }
      dragRef.current = null;
      setIsDragging(false);
    },
    []
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => handlePointerUp(e),
    [handlePointerUp]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (collapsed) return;
      const step = e.shiftKey ? 32 : 8;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onSidebarWidthChange?.(Math.min(SIDEBAR_WIDTH_MAX, sidebarWidth + step));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSidebarWidthChange?.(Math.max(SIDEBAR_WIDTH_MIN, sidebarWidth - step));
      } else if (e.key === "Home") {
        e.preventDefault();
        onSidebarWidthChange?.(SIDEBAR_WIDTH_MIN);
      } else if (e.key === "End") {
        e.preventDefault();
        onSidebarWidthChange?.(SIDEBAR_WIDTH_MAX);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSidebarWidthChange?.(SIDEBAR_WIDTH_DEFAULT);
      }
    },
    [collapsed, onSidebarWidthChange, sidebarWidth]
  );

  const handleDoubleClick = useCallback(() => {
    if (collapsed) return;
    onSidebarWidthChange?.(SIDEBAR_WIDTH_DEFAULT);
  }, [collapsed, onSidebarWidthChange]);

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const cancelDrag = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) cancelDrag();
    };
    window.addEventListener("blur", cancelDrag);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("blur", cancelDrag);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isDragging]);

  return {
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleKeyDown,
    handleDoubleClick,
  };
}
