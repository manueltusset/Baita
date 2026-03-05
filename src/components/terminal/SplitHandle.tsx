import { useCallback, useRef, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { SplitDirection } from "@/lib/types";

interface SplitHandleProps {
  splitId: string;
  direction: SplitDirection;
}

export default function SplitHandle({ splitId, direction }: SplitHandleProps) {
  const { setPaneRatio } = useWorkspaceStore();
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isVertical = direction === "vertical";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);

      const parent = containerRef.current?.parentElement;
      if (!parent) return;

      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:9999;cursor:" +
        (isVertical ? "col-resize" : "row-resize");
      document.body.appendChild(overlay);

      const onMove = (ev: MouseEvent) => {
        const rect = parent.getBoundingClientRect();
        const ratio = isVertical
          ? (ev.clientX - rect.left) / rect.width
          : (ev.clientY - rect.top) / rect.height;
        setPaneRatio(splitId, ratio);
      };

      const onUp = () => {
        setDragging(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        overlay.remove();
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [splitId, isVertical, setPaneRatio],
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        flexShrink: 0,
        width: isVertical ? "12px" : "100%",
        height: isVertical ? "100%" : "12px",
        cursor: isVertical ? "col-resize" : "row-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: isVertical ? "2px" : "100%",
          height: isVertical ? "100%" : "2px",
          borderRadius: "1px",
          background: dragging
            ? "var(--color-accent)"
            : "var(--glass-border-highlight)",
          transition: dragging ? "none" : "background var(--transition-fast)",
        }}
      />
    </div>
  );
}
