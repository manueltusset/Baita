import { type CSSProperties, type ReactNode } from "react";

type GlassLevel = "panel" | "elevated" | "pill";

interface GlassPanelProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  level?: GlassLevel;
  hover?: boolean;
  onClick?: () => void;
}

const LEVEL_CLASS: Record<GlassLevel, string> = {
  panel: "glass-panel",
  elevated: "glass-elevated",
  pill: "glass-pill",
};

export default function GlassPanel({
  children,
  style,
  className,
  level = "panel",
  hover,
  onClick,
}: GlassPanelProps) {
  const cls = [
    LEVEL_CLASS[level],
    hover ? "glass-hover" : "",
    className ?? "",
  ].filter(Boolean).join(" ");

  return (
    <div onClick={onClick} className={cls} style={style}>
      {children}
    </div>
  );
}
