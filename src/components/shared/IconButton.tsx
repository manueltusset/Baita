import { useState, type CSSProperties } from "react";
import MaterialIcon from "./MaterialIcon";

interface IconButtonProps {
  icon: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  size?: number;
  title?: string;
  style?: CSSProperties;
  activeColor?: string;
}

// Mapeamento SVG antigo -> Material Symbols
const ICON_MAP: Record<string, string> = {
  folder: "folder",
  settings: "settings",
  plus: "add",
  x: "close",
  search: "search",
  git_branch: "share",
  git_compare: "compare",
  terminal: "terminal",
  ssh: "language",
  file: "description",
  expand: "open_in_full",
  collapse: "close_fullscreen",
  sun: "light_mode",
  moon: "dark_mode",
  split_h: "horizontal_split",
  split_v: "vertical_split",
};

export default function IconButton({
  icon,
  onClick,
  active = false,
  size = 14,
  title,
  style,
  activeColor = "var(--color-accent-light)",
}: IconButtonProps) {
  const [hovered, setHovered] = useState(false);
  const materialName = ICON_MAP[icon] ?? icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        background: active
          ? "var(--color-accent-dim)"
          : hovered
            ? "var(--color-surface-hover)"
            : "transparent",
        border: `1px solid ${
          active
            ? "var(--color-accent-border)"
            : hovered
              ? "var(--color-border-hover)"
              : "transparent"
        }`,
        borderRadius: "var(--radius-md)",
        padding: "5px 7px",
        color: active
          ? activeColor
          : hovered
            ? "var(--color-text-secondary)"
            : "var(--color-text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all var(--transition-fast)",
        ...style,
      }}
    >
      <MaterialIcon name={materialName} size={size} />
    </button>
  );
}
