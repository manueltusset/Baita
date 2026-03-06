import { useState, useEffect, useCallback } from "react";
import FileTreeNode, { type TreeNode } from "./FileTreeNode";
import { readDirectory, sshExec } from "@/lib/tauri";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useRemoteCwd } from "@/hooks/useRemoteCwd";
import type { SSHProfile } from "@/lib/types";

export default function FileExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Terminal ativo no pane ativo
  const activeTerminalTabId = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    if (!ws) return null;
    const ps = ws.paneStates[ws.activePaneId];
    const tab = ps?.tabs.find((t) => t.id === ps?.activeTabId);
    return tab?.type === "terminal" ? tab.terminalTabId : null;
  });

  // CWD do terminal ativo (reativo)
  const tabCwd = useTerminalStore((s) => {
    if (!activeTerminalTabId) return undefined;
    return s.tabs.find((t) => t.id === activeTerminalTabId)?.cwd;
  });

  // Fallback pro workspace CWD
  const workspaceCwd = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    return ws?.cwd;
  });

  // SSH profile ativo
  const sshProfile = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    if (!ws?.activeSSHProfileId) return null;
    return ws.sshProfiles.find((p) => p.id === ws.activeSSHProfileId) ?? null;
  });

  const rawCwd = tabCwd || workspaceCwd;
  const effectiveCwd = useRemoteCwd(rawCwd, sshProfile);

  // Listar diretorio remoto via SSH
  const loadRemoteDir = useCallback(async (profile: SSHProfile, dirPath: string): Promise<TreeNode[]> => {
    const output = await sshExec(profile, `ls -1paF "${dirPath}"`);
    const lines = output.split("\n").filter((l) => l && l !== "./" && l !== "../");
    return lines.map((line) => {
      const isDir = line.endsWith("/");
      const name = isDir ? line.slice(0, -1) : line;
      return {
        name,
        path: `${dirPath}/${name}`,
        type: isDir ? ("dir" as const) : ("file" as const),
        open: false,
        children: isDir ? [] : undefined,
      };
    });
  }, []);

  // Carrega diretorio raiz (silent = true nao mostra loading state)
  const loadRoot = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const cwd = effectiveCwd && effectiveCwd !== "~" ? effectiveCwd : "/Users";

      let children: TreeNode[];
      if (sshProfile) {
        children = await loadRemoteDir(sshProfile, cwd);
      } else {
        const entries = await readDirectory(cwd);
        children = entries.map((e: any) => ({
          name: e.name,
          path: e.path,
          type: (e.is_dir ?? e.isDir) ? "dir" as const : "file" as const,
          open: false,
          children: (e.is_dir ?? e.isDir) ? [] : undefined,
        }));
      }

      const rootName = cwd.split("/").pop() || cwd;
      setTree({ name: rootName, path: cwd, type: "dir", open: true, children });
      if (!silent) setError(null);
    } catch (e) {
      if (!silent) {
        const msg = String(e);
        setError(sshProfile ? `SSH: ${msg}` : msg);
        setTree({ name: "project", type: "dir", open: true, children: [] });
      }
    }
    if (!silent) setLoading(false);
  }, [effectiveCwd, sshProfile, loadRemoteDir]);

  useEffect(() => {
    loadRoot();
  }, [loadRoot]);

  // Polling silencioso para detectar mudancas no filesystem
  useEffect(() => {
    const interval = setInterval(() => loadRoot(true), 5000);
    return () => clearInterval(interval);
  }, [loadRoot]);

  // Expandir subdiretorio on-demand
  const handleExpand = useCallback(async (nodePath: string) => {
    try {
      let newChildren: TreeNode[];
      if (sshProfile) {
        newChildren = await loadRemoteDir(sshProfile, nodePath);
      } else {
        const entries = await readDirectory(nodePath);
        newChildren = entries.map((e: any) => ({
          name: e.name,
          path: e.path,
          type: (e.is_dir ?? e.isDir) ? "dir" as const : "file" as const,
          open: false,
          children: (e.is_dir ?? e.isDir) ? [] : undefined,
        }));
      }

      setTree((prev) => {
        if (!prev) return prev;
        return updateNodeChildren(prev, nodePath, newChildren);
      });
    } catch {
      // Erro ao ler diretorio
    }
  }, [sshProfile, loadRemoteDir]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 12px",
        borderBottom: "1px solid var(--panel-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--panel-header-bg)",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: "var(--font-size-xs)",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          letterSpacing: "0.08em",
          fontFamily: "var(--font-display)",
        }}>
          {sshProfile ? "REMOTE EXPLORER" : "EXPLORER"}
        </span>
        {sshProfile && (
          <span style={{
            fontSize: "9px",
            fontFamily: "var(--font-mono)",
            color: "var(--color-accent-light)",
            opacity: 0.7,
          }}>
            {sshProfile.username}@{sshProfile.host}
          </span>
        )}
      </div>

      {/* Search */}
      <div style={{
        padding: "6px 8px",
        borderBottom: "1px solid var(--panel-border)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          padding: "5px 8px",
          border: "1px solid var(--glass-border)",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="6" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            placeholder="search file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-mono)",
              flex: 1,
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "6px 12px",
          fontSize: "var(--font-size-xs)",
          fontFamily: "var(--font-mono)",
          color: "var(--color-error)",
          borderBottom: "1px solid var(--panel-border)",
          lineHeight: 1.4,
        }}>
          {error}
        </div>
      )}

      {/* File tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {loading ? (
          <div style={{
            padding: "16px 12px",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-faint)",
            fontFamily: "var(--font-mono)",
          }}>
            loading...
          </div>
        ) : tree ? (
          <FileTreeNode
            node={searchQuery ? filterTree(tree, searchQuery) ?? tree : tree}
            onExpand={handleExpand}
          />
        ) : null}
      </div>

      {/* Footer */}
      <div style={{
        padding: "6px 12px",
        borderTop: "1px solid var(--panel-border)",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        color: "var(--color-text-faint)",
        fontSize: "var(--font-size-xs)",
        fontFamily: "var(--font-mono)",
        background: "var(--panel-header-bg)",
        flexShrink: 0,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-accent-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
        </svg>
        <span style={{ color: "var(--color-text-muted)" }}>
          {tree?.name || "..."}
        </span>
      </div>
    </div>
  );
}

function filterTree(node: TreeNode, query: string): TreeNode | null {
  if (!query) return node;
  const q = query.toLowerCase();
  if (node.type === "file") {
    return node.name.toLowerCase().includes(q) ? node : null;
  }
  const filtered = (node.children ?? [])
    .map((c) => filterTree(c, q))
    .filter(Boolean) as TreeNode[];
  if (filtered.length === 0 && !node.name.toLowerCase().includes(q)) return null;
  return { ...node, children: filtered, open: true };
}

function updateNodeChildren(
  node: TreeNode,
  targetPath: string,
  newChildren: TreeNode[],
): TreeNode {
  if (node.path === targetPath) {
    return { ...node, children: newChildren, open: true };
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map((child) =>
        updateNodeChildren(child, targetPath, newChildren),
      ),
    };
  }
  return node;
}
