import { useTerminalStore } from "@/stores/terminalStore";

export default function MemoryIndicator() {
  const sessionCount = useTerminalStore((s) => s.tabs.length);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
      background: "var(--glass-bg-elevated)",
      border: "1px solid var(--glass-border)",
      borderRadius: "var(--radius-md)",
      padding: "3px 8px",
      fontSize: "var(--font-size-xs)",
      color: "var(--color-text-muted)",
      fontFamily: "var(--font-mono)",
      fontWeight: 500,
    }}>
      <div style={{
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: "var(--color-success)",
        animation: "pulse 2.5s ease-in-out infinite",
      }} />
      {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
    </div>
  );
}
