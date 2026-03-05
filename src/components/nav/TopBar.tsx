import { useState, useRef, useCallback, useEffect, type CSSProperties } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useUIStore } from "@/stores/uiStore";
import { useMetricsStore } from "@/stores/metricsStore";
import NavTab from "./NavTab";
import MaterialIcon from "@/components/shared/MaterialIcon";
import DropdownPopup from "./DropdownPopup";
import SettingsDropdown from "@/components/settings/SettingsDropdown";
import SSHDropdown from "@/components/ssh/SSHDropdown";
import MetricsPopup from "@/components/metrics/MetricsPopup";

type DropdownId = "settings" | "ssh" | "metrics" | null;

export default function TopBar() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, addWorkspace, removeWorkspace } =
    useWorkspaceStore();
  const { toggleSidebar, toggleReviewPanel, toggleCommandPalette } = useUIStore();
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const { latestCpu, latestMemPct, latestDiskPct } = useMetricsStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<DropdownId>(null);
  const [dropdownPos, setDropdownPos] = useState<CSSProperties>({});

  // Atalho Ctrl+, dispara via uiStore
  useEffect(() => {
    if (settingsOpen) {
      setActiveDropdown("settings");
      const container = containerRef.current;
      if (container) {
        const w = 360;
        setDropdownPos({ left: (container.offsetWidth - w) / 2, width: w });
      }
      useUIStore.setState({ settingsOpen: false });
    }
  }, [settingsOpen]);

  const toggleDropdown = useCallback(
    (name: DropdownId, e: React.MouseEvent) => {
      if (activeDropdown === name) {
        setActiveDropdown(null);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const triggerRect = e.currentTarget.getBoundingClientRect();
      const triggerCenter = triggerRect.left + triggerRect.width / 2 - containerRect.left;

      const w = name === "metrics" ? 320 : name === "ssh" ? 340 : 360;
      let left = triggerCenter - w / 2;
      if (left < 8) left = 8;
      if (left + w > containerRect.width - 8) left = containerRect.width - w - 8;

      setDropdownPos({ left, width: w });
      setActiveDropdown(name);
    },
    [activeDropdown],
  );

  const closeDropdown = useCallback(() => setActiveDropdown(null), []);

  return (
    <div
      ref={containerRef}
      data-tauri-drag-region
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 16px 0",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Ilha glass pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: "var(--radius-nav)",
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow-elevated)",
        }}
      >
        {/* Workspace tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {workspaces.map((ws) => (
            <NavTab
              key={ws.id}
              label={ws.name}
              active={ws.id === activeWorkspaceId}
              sshActive={!!ws.activeSSHProfileId}
              onClick={() => setActiveWorkspace(ws.id)}
              onClose={workspaces.length > 1 ? () => removeWorkspace(ws.id) : undefined}
            />
          ))}
          <IconBtn
            icon="add"
            size={12}
            btnSize={20}
            onClick={() => addWorkspace()}
            title="New workspace"
          />
        </div>

        <Separator />

        {/* Acoes */}
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconBtn icon="search" onClick={() => toggleCommandPalette()} title="Search (Ctrl+K)" />
          <IconBtn icon="folder" onClick={() => toggleSidebar()} title="Toggle sidebar" />
          <IconBtn icon="compare" onClick={() => toggleReviewPanel()} title="Code review" />
          <IconBtn
            icon="language"
            onClick={(e) => toggleDropdown("ssh", e)}
            title="SSH"
            active={activeDropdown === "ssh"}
            isDropdownTrigger
          />
          <IconBtn
            icon="settings"
            onClick={(e) => toggleDropdown("settings", e)}
            title="Settings"
            active={activeDropdown === "settings"}
            isDropdownTrigger
          />
        </div>

        <Separator />

        {/* Badges de metricas */}
        <div
          data-topbar-trigger
          onClick={(e) => toggleDropdown("metrics", e)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            padding: "2px 4px",
            borderRadius: "var(--radius-full)",
            background: activeDropdown === "metrics" ? "var(--color-surface-active)" : "transparent",
            transition: "background var(--transition-fast)",
          }}
          title="System metrics"
        >
          <MetricBadge value={latestCpu} color="var(--color-accent)" />
          <MetricBadge value={latestMemPct} color="var(--color-info)" />
          <MetricBadge value={latestDiskPct} color="var(--color-success)" />
        </div>
      </div>

      {/* Dropdown */}
      {activeDropdown && (
        <DropdownPopup onClose={closeDropdown} style={dropdownPos}>
          {activeDropdown === "settings" && <SettingsDropdown />}
          {activeDropdown === "ssh" && <SSHDropdown onClose={closeDropdown} />}
          {activeDropdown === "metrics" && <MetricsPopup />}
        </DropdownPopup>
      )}
    </div>
  );
}

function Separator() {
  return (
    <div
      style={{
        width: 1,
        height: 12,
        background: "var(--glass-border)",
        flexShrink: 0,
      }}
    />
  );
}

function MetricBadge({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 4px ${color}`,
        }}
      />
      <span
        style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          color: "var(--color-text-secondary)",
          minWidth: 24,
          textAlign: "right",
        }}
      >
        {value}%
      </span>
    </div>
  );
}

function IconBtn({
  icon,
  onClick,
  title,
  size = 14,
  btnSize = 24,
  active,
  isDropdownTrigger,
}: {
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  size?: number;
  btnSize?: number;
  active?: boolean;
  isDropdownTrigger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      data-topbar-trigger={isDropdownTrigger ? "" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: btnSize,
        height: btnSize,
        borderRadius: "var(--radius-full)",
        border: "none",
        background: active ? "var(--color-surface-active)" : "transparent",
        color: active ? "var(--color-text)" : "var(--color-text-muted)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--color-surface-hover)";
          e.currentTarget.style.color = "var(--color-text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--color-text-muted)";
        }
      }}
    >
      <MaterialIcon name={icon} size={size} />
    </button>
  );
}
