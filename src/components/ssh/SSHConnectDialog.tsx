import { useState } from "react";
import GlassPanel from "@/components/shared/GlassPanel";

interface SSHConnectDialogProps {
  onClose: () => void;
  onConnect: (data: {
    name: string;
    host: string;
    port: number;
    username: string;
    authMethod: "key" | "password" | "agent";
    keyPath?: string;
  }) => void;
}

export default function SSHConnectDialog({ onClose, onConnect }: SSHConnectDialogProps) {
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState<"key" | "password" | "agent">("agent");
  const [keyPath, setKeyPath] = useState("~/.ssh/id_ed25519");

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    borderRadius: "var(--radius-md)",
    padding: "8px 12px",
    color: "var(--color-text)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--font-size-base)",
    outline: "none",
    width: "100%",
    transition: "border-color var(--transition-fast)",
  } as const;

  const labelStyle = {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-secondary)",
    fontFamily: "var(--font-display)",
    marginBottom: "4px",
    display: "block",
  } as const;

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      zIndex: 60,
      background: "var(--overlay-bg)",
      backdropFilter: "var(--overlay-blur)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <GlassPanel style={{
        borderRadius: "var(--radius-3xl)",
        padding: "24px",
        width: "380px",
        maxWidth: "90vw",
        animation: "scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}>
          <div style={{
            fontSize: "var(--font-size-lg)",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
          }}>
            New SSH Connection
          </div>
          <button onClick={onClose} style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "4px 10px",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: "11px",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
          }}>
            close
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Profile name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Production" style={inputStyle} />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Host</label>
              <input value={host} onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.1" style={inputStyle} />
            </div>
            <div style={{ width: "80px" }}>
              <label style={labelStyle}>Port</label>
              <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))}
                style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="deploy" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Auth method</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["agent", "key", "password"] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setAuthMethod(method)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "var(--radius-md)",
                    background: authMethod === method ? "var(--color-accent-dim)" : "var(--color-surface)",
                    border: `1px solid ${authMethod === method ? "var(--color-accent-border)" : "var(--color-border)"}`,
                    color: authMethod === method ? "var(--color-accent-light)" : "var(--color-text-muted)",
                    cursor: "pointer",
                    fontSize: "var(--font-size-sm)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {method === "agent" ? "Agent" : method === "key" ? "SSH Key" : "Password"}
                </button>
              ))}
            </div>
          </div>

          {authMethod === "key" && (
            <div>
              <label style={labelStyle}>Key path</label>
              <input value={keyPath} onChange={(e) => setKeyPath(e.target.value)}
                style={inputStyle} />
            </div>
          )}

          <button
            onClick={() => onConnect({ name, host, port, username, authMethod, keyPath: authMethod === "key" ? keyPath : undefined })}
            style={{
              background: "var(--color-accent-dim)",
              border: "1px solid var(--color-accent-border)",
              borderRadius: "var(--radius-lg)",
              padding: "10px",
              color: "var(--color-accent-light)",
              fontSize: "var(--font-size-base)",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              cursor: "pointer",
              transition: "all var(--transition-normal)",
              marginTop: "4px",
            }}
          >
            Save & Connect
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
