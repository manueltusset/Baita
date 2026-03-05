import { useTerminalStore } from "@/stores/terminalStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import MaterialIcon from "@/components/shared/MaterialIcon";

interface TerminalStatusBarProps {
  terminalTabId: string;
}

export default function TerminalStatusBar({ terminalTabId }: TerminalStatusBarProps) {
  const tab = useTerminalStore((s) => s.tabs.find((t) => t.id === terminalTabId));

  // Verificar se workspace tem SSH ativo
  const sshProfileName = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    if (!ws?.activeSSHProfileId) return null;
    return ws.sshProfiles.find((p) => p.id === ws.activeSSHProfileId)?.name ?? null;
  });

  const branch = tab?.branch ?? null;
  const cwd = tab?.cwd ?? "~";
  const shortCwd = cwd.replace(/^\/Users\/[^/]+/, "~");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "4px 12px",
      borderTop: "1px solid var(--glass-border)",
      flexShrink: 0,
      minHeight: 26,
      background: "var(--panel-header-bg)",
    }}>
      {/* Esquerda: SSH/branch + cwd */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "var(--font-size-xs)",
        fontFamily: "var(--font-mono)",
        color: "var(--color-text-muted)",
        overflow: "hidden",
      }}>
        {sshProfileName ? (
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-accent-dim)",
          }}>
            <MaterialIcon name="language" size={10} />
            <span style={{ color: "var(--color-accent-light)", fontWeight: 500 }}>{sshProfileName}</span>
          </span>
        ) : branch ? (
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface)",
          }}>
            <MaterialIcon name="share" size={10} />
            <span style={{ color: "var(--color-accent-light)", fontWeight: 500 }}>{branch}</span>
          </span>
        ) : null}
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "var(--color-text-faint)",
        }}>
          {shortCwd}
        </span>
      </div>

      {/* Direita: status */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "var(--font-size-xs)",
        fontFamily: "var(--font-mono)",
        color: "var(--color-text-faint)",
        flexShrink: 0,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--color-success)",
            boxShadow: "0 0 4px var(--color-success)",
          }} />
          <span style={{ color: "var(--color-text-muted)" }}>Active</span>
        </span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
