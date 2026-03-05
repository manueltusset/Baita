import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { tabCreate } from "@/lib/tauri";
import { getSSHShellConfig } from "@/lib/ssh";
import PaneTabBar from "./PaneTabBar";
import PaneTabContent from "./PaneTabContent";
import TerminalStatusBar from "./TerminalStatusBar";

interface PaneLeafContainerProps {
  paneId: string;
}

export default function PaneLeafContainer({ paneId }: PaneLeafContainerProps) {
  const setActivePaneId = useWorkspaceStore((s) => s.setActivePaneId);
  const updatePaneTab = useWorkspaceStore((s) => s.updatePaneTab);

  const paneState = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    return ws?.paneStates[paneId] ?? null;
  });

  const isActivePane = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    return ws?.activePaneId === paneId;
  });

  const tabs = paneState?.tabs ?? [];
  const activeTabId = paneState?.activeTabId ?? "";
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  const creatingRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Criar PTY para tabs terminal sem terminalTabId
  useEffect(() => {
    if (!paneState || creatingRef.current) return;
    const pendingTab = paneState.tabs.find(
      (t) => t.type === "terminal" && !t.terminalTabId,
    );
    if (!pendingTab) return;

    creatingRef.current = true;
    const init = async (attempt = 0) => {
      try {
        // Verificar SSH ativo no workspace
        const state = useWorkspaceStore.getState();
        const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
        const sshProfile = workspace?.activeSSHProfileId
          ? workspace.sshProfiles.find((p) => p.id === workspace.activeSSHProfileId)
          : null;
        const sshConfig = sshProfile ? getSSHShellConfig(sshProfile) : null;

        const result = sshConfig
          ? await tabCreate(undefined, sshConfig.shell, sshConfig.shellArgs)
          : await tabCreate();

        useTerminalStore.getState().addTab({
          id: result.id,
          label: result.label,
          branch: null,
          state: "active",
          dirty: 0,
          cwd: result.cwd,
          shell: result.shell,
        });
        updatePaneTab(paneId, pendingTab.id, {
          terminalTabId: result.id,
          label: sshConfig && sshProfile ? sshProfile.name : result.shell,
        });
        creatingRef.current = false;
      } catch {
        if (attempt < 5) {
          retryTimerRef.current = setTimeout(() => init(attempt + 1), 500 * (attempt + 1));
        } else {
          creatingRef.current = false;
        }
      }
    };
    init();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [paneId, paneState?.tabs, updatePaneTab]);

  if (!activeTab) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text-faint)",
        fontSize: "var(--font-size-sm)",
        fontFamily: "var(--font-mono)",
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      onClick={() => setActivePaneId(paneId)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${isActivePane ? "var(--color-accent-border)" : "var(--glass-border)"}`,
        borderRadius: "var(--radius-3xl)",
        overflow: "hidden",
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        transition: "all var(--transition-smooth)",
        minHeight: 0,
        boxShadow: isActivePane
          ? "var(--glass-shadow), 0 0 0 1px var(--glass-glow-accent)"
          : "var(--glass-shadow)",
      }}
    >
      <PaneTabBar
        paneId={paneId}
        tabs={tabs}
        activeTabId={activeTabId}
        isActivePane={isActivePane}
      />

      {tabs.map((tab) => {
        const isThisActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            style={{
              flex: isThisActive ? 1 : undefined,
              display: isThisActive ? "flex" : "none",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <PaneTabContent tab={tab} isActive={isActivePane && isThisActive} />
          </div>
        );
      })}

      {activeTab.type === "terminal" && activeTab.terminalTabId && (
        <TerminalStatusBar terminalTabId={activeTab.terminalTabId} />
      )}
    </div>
  );
}
