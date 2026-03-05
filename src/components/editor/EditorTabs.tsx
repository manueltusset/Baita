import { useState } from "react";
import { useEditorStore } from "@/stores/editorStore";

const LANG_COLORS: Record<string, string> = {
  rust: "#f74c00",
  tsx: "#00b8ff",
  ts: "#3178c6",
  css: "#06b6d4",
  json: "#f59e0b",
};

export default function EditorTabs() {
  const { files, activeFilePath, setActiveFile, closeFile } = useEditorStore();

  return (
    <div style={{
      display: "flex",
      gap: "1px",
      padding: "5px 8px",
      borderBottom: "1px solid var(--panel-border)",
      background: "var(--panel-header-bg)",
      overflowX: "auto",
      flexShrink: 0,
    }}>
      {files.map((file) => {
        const isActive = file.path === activeFilePath;
        const color = LANG_COLORS[file.language] ?? "var(--color-text-muted)";

        return (
          <TabItem
            key={file.path}
            name={file.name}
            modified={file.modified}
            active={isActive}
            color={color}
            onClick={() => setActiveFile(file.path)}
            onClose={() => closeFile(file.path)}
          />
        );
      })}
    </div>
  );
}

function TabItem({
  name, modified, active, color, onClick, onClose,
}: {
  name: string;
  modified: boolean;
  active: boolean;
  color: string;
  onClick: () => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "var(--radius-md)",
        background: active ? "var(--color-surface-active)" : "transparent",
        border: `1px solid ${active ? "var(--color-border)" : "transparent"}`,
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        fontSize: "var(--font-size-sm)",
        fontFamily: "var(--font-mono)",
        color: active ? "var(--color-text)" : "var(--color-text-muted)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color, fontSize: "9px", fontWeight: 700 }}>
        {name.split(".").pop()?.toUpperCase().slice(0, 3)}
      </span>
      <span>{name}</span>
      {modified && (
        <span style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "var(--color-warning)",
          flexShrink: 0,
        }} />
      )}
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: "11px",
            padding: "0 2px",
            fontFamily: "var(--font-mono)",
            lineHeight: 1,
          }}
        >
          x
        </button>
      )}
    </div>
  );
}
