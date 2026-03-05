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
            width: "min(560px, 90%)",
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-lg)",
            animation: "scaleIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
            }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: "var(--color-text-muted)", lineHeight: 1 }}
              >
                search
              </span>
              <input
                autoFocus
                placeholder="Type a command..."
                onKeyDown={(e) => { if (e.key === "Escape") toggleCommandPalette(); }}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--color-text)",
                  fontSize: "var(--font-size-md)",
                  fontFamily: "var(--font-mono)",
                }}
              />
              <span style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-faint)",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}>
                ESC
              </span>
            </div>
            <div style={{
              borderTop: "1px solid var(--color-border)",
              padding: "12px 16px",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-faint)",
              fontFamily: "var(--font-mono)",
              textAlign: "center",
            }}>
              Start typing to search commands...
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
