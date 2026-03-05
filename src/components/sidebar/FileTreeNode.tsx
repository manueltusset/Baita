import { useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { readFile } from "@/lib/tauri";

const EXT_COLORS: Record<string, string> = {
  rs: "#f74c00",
  tsx: "#00b8ff",
  ts: "#3178c6",
  jsx: "#00b8ff",
  js: "#f7df1e",
  toml: "#9ca3af",
  json: "#f59e0b",
  md: "#a78bfa",
  css: "#06b6d4",
  html: "#e34c26",
  py: "#3776ab",
  go: "#00add8",
  yaml: "#cb171e",
  yml: "#cb171e",
  sh: "#4eaa25",
  lock: "#6b7280",
};

export interface TreeNode {
  name: string;
  path?: string;
  type: "file" | "dir";
  open?: boolean;
  children?: TreeNode[];
}

interface FileTreeNodeProps {
  node: TreeNode;
  depth?: number;
  onExpand?: (path: string) => void;
}

export default function FileTreeNode({ node, depth = 0, onExpand }: FileTreeNodeProps) {
  const [open, setOpen] = useState(node.open ?? false);
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isDir = node.type === "dir";
  const ext = node.name.split(".").pop() ?? "";
  const color = EXT_COLORS[ext] ?? "var(--color-text-muted)";
  const { openFile } = useEditorStore();
  const { addPaneTab, setActivePaneTab } = useWorkspaceStore();

  const handleClick = async () => {
    if (isDir) {
      const willOpen = !open;
      setOpen(willOpen);
      // Carrega conteudo do diretorio on-demand na primeira expansao
      if (willOpen && !loaded && node.path && onExpand) {
        onExpand(node.path);
        setLoaded(true);
      }
      return;
    }
    const filePath = node.path ?? node.name;
    try {
      const result = await readFile(filePath);
      openFile({
        path: result.path,
        name: node.name,
        language: result.language || ext,
        content: result.content,
        modified: false,
      });
    } catch {
      openFile({
        path: filePath,
        name: node.name,
        language: ext,
        content: "",
        modified: false,
      });
    }
    // Abrir tab editor no pane ativo
    const ws = useWorkspaceStore.getState();
    const activeWs = ws.workspaces.find((w) => w.id === ws.activeWorkspaceId);
    if (activeWs) {
      const ps = activeWs.paneStates[activeWs.activePaneId];
      // Verificar se ja tem tab editor no pane
      const existingEditor = ps?.tabs.find((t) => t.type === "editor");
      if (existingEditor) {
        setActivePaneTab(activeWs.activePaneId, existingEditor.id);
        useWorkspaceStore.getState().updatePaneTab(
          activeWs.activePaneId, existingEditor.id,
          { label: node.name, filePath },
        );
      } else {
        const tabId = `pt-editor-${Date.now()}`;
        addPaneTab(activeWs.activePaneId, {
          id: tabId,
          type: "editor",
          label: node.name,
          filePath,
        });
      }
    }
  };

  // Sincroniza estado open quando a prop muda (ex: apos carregar children)
  const isOpen = node.open !== undefined ? node.open && open : open;

  return (
    <div>
      <div
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: `3px 8px 3px ${8 + depth * 14}px`,
          cursor: "pointer",
          borderRadius: "var(--radius-md)",
          color: hovered
            ? "var(--color-text-secondary)"
            : isDir
              ? "var(--color-text-secondary)"
              : "var(--color-text-muted)",
          fontSize: "var(--font-size-sm)",
          fontFamily: "var(--font-mono)",
          transition: "all var(--transition-fast)",
          userSelect: "none",
          background: hovered ? "var(--color-surface-hover)" : "transparent",
        }}
      >
        {isDir ? (
          <span style={{
            color: "var(--color-text-faint)",
            fontSize: "8px",
            width: "10px",
            flexShrink: 0,
            transition: "transform var(--transition-fast)",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            display: "inline-block",
          }}>
            {"\u276F"}
          </span>
        ) : (
          <span style={{ width: "10px", flexShrink: 0 }} />
        )}

        {isDir ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={isOpen ? "var(--color-accent-light)" : "var(--color-text-muted)"}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, transition: "stroke var(--transition-fast)" }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ) : (
          <span style={{
            color,
            fontSize: "9px",
            fontWeight: 700,
            width: "13px",
            textAlign: "center",
            flexShrink: 0,
            letterSpacing: "-0.02em",
          }}>
            {ext.toUpperCase().slice(0, 3)}
          </span>
        )}

        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {node.name}
        </span>
      </div>

      {isDir && isOpen && node.children?.map((child, i) => (
        <FileTreeNode key={child.path || i} node={child} depth={depth + 1} onExpand={onExpand} />
      ))}
    </div>
  );
}
