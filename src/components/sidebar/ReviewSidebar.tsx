import { useCallback } from "react";
import GlassPanel from "@/components/shared/GlassPanel";
import CodeReview from "@/components/review/CodeReview";
import { useUIStore } from "@/stores/uiStore";

export default function ReviewSidebar() {
  const { reviewPanelOpen, reviewPanelWidth, setReviewPanelWidth } = useUIStore();

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = reviewPanelWidth;
    const onMove = (ev: MouseEvent) => {
      // Handle esquerdo: arrastar pra esquerda aumenta largura
      setReviewPanelWidth(startWidth - (ev.clientX - startX));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [reviewPanelWidth, setReviewPanelWidth]);

  if (!reviewPanelOpen) return null;

  return (
    <div style={{ position: "relative", flexShrink: 0, width: reviewPanelWidth }}>
      {/* Resize handle na esquerda */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          position: "absolute",
          left: -2,
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

      <GlassPanel
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "var(--radius-3xl)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        }}
      >
        <CodeReview />
      </GlassPanel>
    </div>
  );
}
