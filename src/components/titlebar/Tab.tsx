import { useState } from "react";
import type { TabInfo } from "@/lib/types";

function BranchIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

interface TabProps {
  tab: TabInfo;
  active: boolean;
  onClick: () => void;
  onClose: () => void;
  closable: boolean;
}

export default function Tab({ tab, active, onClick, onClose, closable }: TabProps) {
  const [hovered, setHovered] = useState(false);
  const isHibernated = tab.state === "hibernated";
  const isSuspended = tab.state === "suspended";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "4px 14px",
        borderRadius: "var(--radius-lg)",
        border: active
          ? "1px solid var(--color-accent-border)"
          : "1px solid transparent",
        cursor: "pointer",
        fontSize: "var(--font-size-sm)",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-display)",
        fontWeight: active ? 600 : 400,
        background: active
          ? "rgba(124,58,237,0.2)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "transparent",
        color: active
          ? "var(--color-accent-lighter)"
          : "rgba(255,255,255,0.3)",
        transition: "all var(--transition-fast)",
        outline: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* State indicator */}
      {(isHibernated || isSuspended) && (
        <span style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: isHibernated ? "var(--color-accent-light)" : "var(--color-warning)",
          flexShrink: 0,
          opacity: isHibernated ? 0.8 : 0.6,
        }} />
      )}

      {/* Branch icon */}
      {tab.branch && (
        <BranchIcon
          color={active ? "var(--color-accent-light)" : "rgba(255,255,255,0.2)"}
        />
      )}

      {/* Label */}
      <span>{tab.label}</span>

      {/* Hibernated badge */}
      {isHibernated && (
        <span style={{
          fontSize: "9px",
          padding: "1px 5px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(167,139,250,0.15)",
          color: "var(--color-accent-light)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
        }}>
          zzz
        </span>
      )}

      {/* Suspended badge */}
      {isSuspended && (
        <span style={{
          fontSize: "9px",
          padding: "1px 5px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(245,158,11,0.12)",
          color: "var(--color-warning)",
          fontFamily: "var(--font-mono)",
        }}>
          paused
        </span>
      )}

      {/* Close button */}
      {closable && hovered && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            lineHeight: 1,
            color: "var(--color-text-muted)",
            background: "rgba(255,255,255,0.06)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all var(--transition-fast)",
          }}
        >
          x
        </span>
      )}

      {/* Shimmer on hover */}
      {hovered && !active && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
          animation: "shimmer 1.5s ease-in-out infinite",
          backgroundSize: "200% 100%",
          pointerEvents: "none",
        }} />
      )}
    </button>
  );
}
