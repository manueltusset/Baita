import SSHProfileList from "./SSHProfileList";
import SSHConnectDialog from "./SSHConnectDialog";
import { useSSHStore } from "@/stores/sshStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export default function SSHManager() {
  const { connectDialogOpen, toggleConnectDialog } = useSSHStore();
  const { addSSHProfile, removeSSHProfile, connectSSH } = useWorkspaceStore();

  const activeSSHProfileId = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    return ws?.activeSSHProfileId ?? null;
  });

  const profiles = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    return ws?.sshProfiles ?? [];
  });

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      border: "1px solid var(--glass-border)",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      background: "transparent",
      animation: "fadeSlideIn 0.15s ease forwards",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 12px",
        borderBottom: "1px solid var(--glass-border)",
        background: "var(--glass-bg-elevated)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span style={{
            fontSize: "var(--font-size-xs)",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-display)",
          }}>
            SSH MANAGER
          </span>
        </div>

        <button
          onClick={toggleConnectDialog}
          style={{
            background: "var(--color-accent-dim)",
            border: "1px solid var(--color-accent-border)",
            borderRadius: "var(--radius-md)",
            padding: "4px 10px",
            color: "var(--color-accent-light)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          + new connection
        </button>
      </div>

      {/* Profile list */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
        {profiles.length > 0 ? (
          <SSHProfileList
            profiles={profiles}
            activeSessionId={activeSSHProfileId}
            onConnect={(profile) => connectSSH(profile.id)}
            onRemove={(id) => removeSSHProfile(id)}
          />
        ) : (
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-faint)",
            fontSize: "var(--font-size-sm)",
            fontFamily: "var(--font-mono)",
            padding: "40px 0",
          }}>
            No SSH profiles saved
          </div>
        )}
      </div>

      {connectDialogOpen && (
        <SSHConnectDialog
          onClose={toggleConnectDialog}
          onConnect={(data) => {
            addSSHProfile({
              id: `ssh-${Date.now()}`,
              name: data.name,
              host: data.host,
              port: data.port,
              username: data.username,
              authMethod: data.authMethod,
              keyPath: data.keyPath,
            });
            toggleConnectDialog();
          }}
        />
      )}
    </div>
  );
}
