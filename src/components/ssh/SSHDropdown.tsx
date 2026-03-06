import { useShallow } from "zustand/react/shallow";
import SSHProfileList from "./SSHProfileList";
import SSHConnectDialog from "./SSHConnectDialog";
import { useSSHStore } from "@/stores/sshStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import MaterialIcon from "@/components/shared/MaterialIcon";

const emptyProfiles: import("@/lib/types").SSHProfile[] = [];

interface SSHDropdownProps {
  onClose: () => void;
}

export default function SSHDropdown({ onClose }: SSHDropdownProps) {
  const connectDialogOpen = useSSHStore((s) => s.connectDialogOpen);
  const toggleConnectDialog = useSSHStore((s) => s.toggleConnectDialog);
  const { addSSHProfile, removeSSHProfile, connectSSH, disconnectSSH } = useWorkspaceStore(
    useShallow((s) => ({
      addSSHProfile: s.addSSHProfile,
      removeSSHProfile: s.removeSSHProfile,
      connectSSH: s.connectSSH,
      disconnectSSH: s.disconnectSSH,
    })),
  );

  const activeSSHProfileId = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    return ws?.activeSSHProfileId ?? null;
  });

  const profiles = useWorkspaceStore(
    useShallow((s) => {
      const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
      return ws?.sshProfiles ?? emptyProfiles;
    }),
  );

  const connectedProfile = activeSSHProfileId
    ? profiles.find((p) => p.id === activeSSHProfileId)
    : null;

  // Modo formulario inline
  if (connectDialogOpen) {
    return (
      <SSHConnectDialog
        inline
        onClose={toggleConnectDialog}
        onConnect={(data) => {
          const id = `ssh-${Date.now()}`;
          addSSHProfile({
            id,
            name: data.name,
            host: data.host,
            port: data.port,
            username: data.username,
            authMethod: data.authMethod,
            keyPath: data.keyPath,
          });
          connectSSH(id);
          toggleConnectDialog();
          onClose();
        }}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: "var(--font-size-sm)",
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        color: "var(--color-text)",
        marginBottom: 12,
      }}>
        <MaterialIcon name="language" size={16} />
        SSH
      </div>

      {/* Status de conexao */}
      {connectedProfile && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderRadius: "var(--radius-lg)",
          background: "var(--glass-glow-accent)",
          border: "1px solid var(--color-accent-border)",
          marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-accent)",
              boxShadow: "0 0 6px var(--color-accent)",
            }} />
            <span style={{
              fontSize: "11px",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--color-text)",
            }}>
              {connectedProfile.name}
            </span>
            <span style={{
              fontSize: "9px",
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
            }}>
              {connectedProfile.username}@{connectedProfile.host}
            </span>
          </div>
          <button
            onClick={() => disconnectSSH()}
            style={{
              background: "rgba(248, 113, 113, 0.1)",
              border: "1px solid rgba(248, 113, 113, 0.2)",
              borderRadius: "var(--radius-md)",
              padding: "3px 8px",
              color: "var(--color-error)",
              fontSize: "9px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-display)",
            }}
          >
            disconnect
          </button>
        </div>
      )}

      {/* Lista de profiles */}
      <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 10 }}>
        {profiles.filter((p) => p.id !== activeSSHProfileId).length > 0 ? (
          <SSHProfileList
            profiles={profiles.filter((p) => p.id !== activeSSHProfileId)}
            activeSessionId={activeSSHProfileId}
            onConnect={(profile) => connectSSH(profile.id)}
            onRemove={(id) => removeSSHProfile(id)}
          />
        ) : (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-faint)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            padding: "16px 0",
          }}>
            No SSH profiles
          </div>
        )}
      </div>

      {/* Botao add */}
      <button
        onClick={toggleConnectDialog}
        style={{
          width: "100%",
          padding: "8px",
          background: "var(--color-accent-dim)",
          border: "1px solid var(--color-accent-border)",
          borderRadius: "var(--radius-lg)",
          color: "var(--color-accent-light)",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-display)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          transition: "all var(--transition-fast)",
        }}
      >
        <MaterialIcon name="add" size={14} />
        New Connection
      </button>
    </>
  );
}
