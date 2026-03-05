import { useState } from "react";
import MaterialIcon from "@/components/shared/MaterialIcon";

interface NavTabProps {
  label: string;
  active: boolean;
  sshActive?: boolean;
  onClick: () => void;
  onClose?: () => void;
}

export default function NavTab({ label, active, sshActive, onClick, onClose }: NavTabProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 14px",
        borderRadius: "var(--radius-full)",
        border: "none",
        background: active ? "var(--color-surface-active)" : "transparent",
        color: active ? "var(--color-text)" : "var(--color-text-muted)",
        fontSize: "var(--font-size-sm)",
        fontFamily: "var(--font-display)",
        fontWeight: active ? 500 : 400,
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        position: "relative",
      }}
    >
      {label}
      {sshActive && (
        <div style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "var(--color-accent)",
          flexShrink: 0,
        }} />
      )}
      {onClose && hovered && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "var(--color-surface-active)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            marginLeft: "2px",
            flexShrink: 0,
          }}
        >
          <MaterialIcon name="close" size={10} />
        </span>
      )}
    </button>
  );
}
