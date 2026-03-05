import { useCallback } from "react";
import GlassPanel from "@/components/shared/GlassPanel";
import FileExplorer from "./FileExplorer";
import { useUIStore } from "@/stores/uiStore";

export default function Sidebar() {
  const { sidebarOpen, sidebarWidth, setSidebarWidth } = useUIStore();

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      setSidebarWidth(startWidth + ev.clientX - startX);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sidebarWidth, setSidebarWidth]);

  if (!sidebarOpen) return null;

  return (
    <div style={{ position: "relative", flexShrink: 0, width: sidebarWidth }}>
      <GlassPanel
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "var(--radius-3xl)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "slideInLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        }}
      >
        <FileExplorer />
      </GlassPanel>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          position: "absolute",
          right: -2,
          top: 0,
          bottom: 0,
          width: "5px",
          cursor: "col-resize",
          zIndex: 5,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "var(--color-accent-dim)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      />
    </div>
  );
}
