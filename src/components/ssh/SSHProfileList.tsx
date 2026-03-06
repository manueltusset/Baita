import { useState } from "react";
import type { SSHProfile } from "@/lib/types";

interface SSHProfileListProps {
  profiles: SSHProfile[];
  activeSessionId: string | null;
  onConnect: (profile: SSHProfile) => void;
  onRemove: (id: string) => void;
}

export default function SSHProfileList({ profiles, activeSessionId, onConnect, onRemove }: SSHProfileListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          connected={profile.id === activeSessionId}
          onConnect={() => onConnect(profile)}
          onRemove={() => onRemove(profile.id)}
        />
      ))}
    </div>
  );
}

function ProfileCard({
  profile, connected, onConnect, onRemove,
}: {
  profile: SSHProfile;
  connected: boolean;
  onConnect: () => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        borderRadius: "var(--radius-xl)",
        background: connected
          ? "var(--glass-glow-accent)"
          : hovered
            ? "var(--glass-bg-elevated)"
            : "transparent",
        border: `1px solid ${connected ? "var(--color-accent-border)" : "var(--glass-border)"}`,
        transition: "all var(--transition-fast)",
      }}
    >
      {/* Status indicator */}
      <div style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: connected ? "var(--color-accent)" : "var(--color-text-faint)",
        boxShadow: connected ? "0 0 8px var(--color-accent-glow)" : "none",
        flexShrink: 0,
        transition: "all var(--transition-smooth)",
      }} />

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: "var(--font-size-base)",
          fontWeight: 600,
          color: "var(--color-text)",
          fontFamily: "var(--font-display)",
        }}>
          {profile.name}
        </div>
        <div style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          marginTop: "2px",
        }}>
          {profile.username}@{profile.host}:{profile.port}
        </div>
      </div>

      {/* Auth badge OU botoes de acao (mesmo slot) */}
      {hovered ? (
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          <button
            onClick={onConnect}
            style={{
              background: connected ? "rgba(248,113,113,0.1)" : "var(--color-accent-dim)",
              border: `1px solid ${connected ? "rgba(248,113,113,0.2)" : "var(--color-accent-border)"}`,
              borderRadius: "var(--radius-md)",
              padding: "3px 10px",
              color: connected ? "var(--color-error)" : "var(--color-accent-light)",
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
            }}
          >
            {connected ? "disconnect" : "connect"}
          </button>
          <button
            onClick={onRemove}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              padding: "3px 8px",
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}
          >
            x
          </button>
        </div>
      ) : (
        <span style={{
          fontSize: "9px",
          padding: "2px 6px",
          borderRadius: "var(--radius-sm)",
          background: "var(--glass-bg-elevated)",
          border: "1px solid var(--glass-border)",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {profile.authMethod}
        </span>
      )}
    </div>
  );
}
