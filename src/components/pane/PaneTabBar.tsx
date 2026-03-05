import { useState } from "react";
import type { PaneTab, PaneTabType } from "@/lib/types";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { tabCreate } from "@/lib/tauri";
import { getSSHShellConfig } from "@/lib/ssh";
import MaterialIcon from "@/components/shared/MaterialIcon";

interface PaneTabBarProps {
  paneId: string;
  tabs: PaneTab[];
  activeTabId: string;
  isActivePane: boolean;
}

const TAB_ICONS: Record<PaneTabType, string> = {
  terminal: "terminal",
  editor: "description",
};

const TAB_LABELS: Record<PaneTabType, string> = {
  terminal: "Terminal",
  editor: "Editor",
};

let tabCounter = 0;

export default function PaneTabBar({ paneId, tabs, activeTabId, isActivePane }: PaneTabBarProps) {
  const { setActivePaneTab, removePaneTab, addPaneTab, splitPane, closePane } = useWorkspaceStore();
  const [showMenu, setShowMenu] = useState(false);
  const canClose = tabs.length > 1;

  const paneRoot = useWorkspaceStore((s) => {
    const w = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    return w?.paneRoot ?? null;
  });

  const canClosePane = (() => {
    if (!paneRoot) return false;
    const countLeaves = (node: import("@/lib/types").PaneNode): number =>
      node.type === "leaf" ? 1 : countLeaves(node.children[0]) + countLeaves(node.children[1]);
    return countLeaves(paneRoot) > 1;
  })();

  const handleAddTab = async (type: PaneTabType) => {
    setShowMenu(false);
    const id = `pt-${++tabCounter}-${Date.now()}`;

    if (type === "terminal") {
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
        addPaneTab(paneId, {
          id,
          type: "terminal",
          label: sshConfig && sshProfile ? sshProfile.name : result.shell,
          terminalTabId: result.id,
        });
      } catch {
        addPaneTab(paneId, { id, type: "terminal", label: "shell", terminalTabId: "" });
      }
    } else {
      addPaneTab(paneId, { id, type, label: TAB_LABELS[type] });
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      padding: "0 8px",
      height: "28px",
      borderBottom: "1px solid var(--glass-border)",
      flexShrink: 0,
      gap: "2px",
    }}>
      {/* Indicador de pane ativo */}
      <div style={{
        width: 4,
        height: 4,
        borderRadius: "50%",
        background: isActivePane ? "var(--color-accent)" : "var(--color-text-faint)",
        flexShrink: 0,
        marginRight: "4px",
        transition: "background var(--transition-smooth)",
        animation: isActivePane ? "pulse 1.8s ease-in-out infinite" : "none",
      }} />

      {/* Tabs */}
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => setActivePaneTab(paneId, tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "2px 8px",
              borderRadius: "var(--radius-lg)",
              border: active ? "1px solid var(--color-accent-border)" : "1px solid transparent",
              background: active ? "var(--glass-glow-accent)" : "transparent",
              color: active ? "var(--color-accent-light)" : "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "var(--font-size-xs)",
              fontFamily: "var(--font-mono)",
              transition: "all var(--transition-fast)",
              flexShrink: 0,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = "var(--color-surface-hover)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            <MaterialIcon name={TAB_ICONS[tab.type]} size={12} />
            <span>{tab.label}</span>
            {canClose && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  removePaneTab(paneId, tab.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "2px",
                  width: 14,
                  height: 14,
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-text-faint)",
                  cursor: "pointer",
                  lineHeight: 1,
                  transition: "all var(--transition-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-surface-hover)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-text-faint)";
                }}
              >
                <MaterialIcon name="close" size={11} />
              </span>
            )}
          </button>
        );
      })}

      {/* Add tab dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: "var(--radius-md)",
            padding: "3px",
            color: "var(--color-text-faint)",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-faint)";
          }}
        >
          <MaterialIcon name="add" size={14} />
        </button>
        {showMenu && (
          <div
            className="glass-elevated"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "4px",
              borderRadius: "var(--radius-lg)",
              padding: "4px",
              zIndex: 50,
              minWidth: "140px",
            }}
            onMouseLeave={() => setShowMenu(false)}
          >
            {(["terminal", "editor"] as PaneTabType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleAddTab(type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "6px 10px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-xs)",
                  fontFamily: "var(--font-mono)",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-surface-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <MaterialIcon name={TAB_ICONS[type]} size={14} />
                {TAB_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Pane controls */}
      <div style={{ display: "flex", gap: "2px" }}>
        <PaneControlButton
          icon="vertical_split"
          title="Split vertical"
          onClick={(e) => { e.stopPropagation(); splitPane(paneId, "vertical"); }}
        />
        <PaneControlButton
          icon="horizontal_split"
          title="Split horizontal"
          onClick={(e) => { e.stopPropagation(); splitPane(paneId, "horizontal"); }}
        />
        {canClosePane && (
          <PaneControlButton
            icon="close"
            title="Close pane"
            onClick={(e) => { e.stopPropagation(); closePane(paneId); }}
          />
        )}
      </div>
    </div>
  );
}

function PaneControlButton({ icon, title, onClick }: {
  icon: string;
  title: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: "var(--radius-md)",
        border: "none",
        background: "transparent",
        color: "var(--color-text-faint)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-surface-hover)";
        e.currentTarget.style.color = "var(--color-text-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--color-text-faint)";
      }}
    >
      <MaterialIcon name={icon} size={13} />
    </button>
  );
}
