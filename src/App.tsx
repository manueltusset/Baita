import { useEffect } from "react";
import TopBar from "@/components/nav/TopBar";
import Sidebar from "@/components/sidebar/Sidebar";
import ReviewSidebar from "@/components/sidebar/ReviewSidebar";
import PaneContainer from "@/components/terminal/PaneContainer";
import { useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useTabLifecycle } from "@/hooks/useTabLifecycle";
import { onCwdChanged } from "@/lib/tauri";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";

export default function App() {
  const { showCommandPalette, toggleCommandPalette } = useUIStore();
  const { workspaces, activeWorkspaceId, initFirstWorkspace, setWorkspaceCwd } = useWorkspaceStore();

  useKeyboard();
  useTabLifecycle();
  useSystemMetrics();

  // Inicializar primeiro workspace com PTY real
  useEffect(() => {
    if (workspaces.length === 0) {
      initFirstWorkspace();
    }
  }, []);

  // Escuta mudancas de CWD do backend
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    let cancelled = false;

    onCwdChanged((event) => {
      useTerminalStore.getState().setCwd(event.tab_id, event.cwd);
      const ws = useWorkspaceStore.getState().findWorkspaceByTerminalTabId(event.tab_id);
      if (ws) {
        setWorkspaceCwd(ws.id, event.cwd);
      }
    }).then((fn) => {
      if (cancelled) fn();
      else unlistenFn = fn;
    }).catch(() => {});

    return () => {
      cancelled = true;
      unlistenFn?.();
    };
  }, []);

  return (
    <div style={{
      width: "100%",
      height: "100vh",
      background: "var(--color-bg)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
      transition: "background-color 0.3s ease",
    }}>
      {/* Gradient blobs */}
      <div style={{
        position: "absolute",
        top: "-15%",
        left: "-10%",
        width: "50%",
        height: "50%",
        background: "var(--blob-accent)",
        borderRadius: "50%",
        filter: "blur(140px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute",
        bottom: "-15%",
        right: "-10%",
        width: "40%",
        height: "40%",
        background: "var(--blob-cool)",
        borderRadius: "50%",
        filter: "blur(140px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <TopBar />

      {/* Area principal */}
      <div style={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
        padding: "8px 20px 16px",
        gap: "12px",
      }}>
        <Sidebar />
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          position: "relative",
        }}>
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              style={{
                display: ws.id === activeWorkspaceId ? "flex" : "none",
                flex: 1,
                flexDirection: "column",
                minHeight: 0,
                gap: "12px",
              }}
            >
              <PaneContainer node={ws.paneRoot} />
            </div>
          ))}
        </div>
        <ReviewSidebar />
      </div>

      {/* Command Palette (Ctrl+K) */}
      {showCommandPalette && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) toggleCommandPalette(); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "20vh",
            background: "var(--overlay-bg)",
            backdropFilter: "var(--overlay-blur)",
            WebkitBackdropFilter: "var(--overlay-blur)",
          }}
        >
          <div style={{
            width: "min(600px, 90%)",
            padding: "12px 16px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
            fontFamily: "var(--font-mono)",
            textAlign: "center",
          }}>
            Command Palette (coming soon)
          </div>
        </div>
      )}

    </div>
  );
}
