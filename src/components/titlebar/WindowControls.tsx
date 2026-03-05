import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const BUTTONS = [
  { color: "#ff5f57", hoverColor: "#ff3b30", action: "close" },
  { color: "#ffbd2e", hoverColor: "#ff9f0a", action: "minimize" },
  { color: "#28c840", hoverColor: "#30d158", action: "maximize" },
];

export default function WindowControls() {
  const [hovered, setHovered] = useState(false);

  const handleClick = (action: string) => {
    const win = getCurrentWindow();
    switch (action) {
      case "close":
        win.close();
        break;
      case "minimize":
        win.minimize();
        break;
      case "maximize":
        win.toggleMaximize();
        break;
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        gap: "7px",
        flexShrink: 0,
        padding: "0 2px",
      }}
    >
      {BUTTONS.map((btn, i) => (
        <div
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            handleClick(btn.action);
          }}
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: hovered ? btn.hoverColor : btn.color,
            opacity: hovered ? 1 : 0.85,
            transition: "all var(--transition-fast)",
            cursor: "pointer",
            boxShadow: hovered
              ? `0 0 6px ${btn.color}40`
              : "none",
          }}
        />
      ))}
    </div>
  );
}
