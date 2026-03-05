import { useState } from "react";
import ChangedFileList from "./ChangedFileList";
import DiffView from "./DiffView";
import { useTerminalStore } from "@/stores/terminalStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useGitStatus } from "@/hooks/useGitStatus";
import { useRemoteCwd } from "@/hooks/useRemoteCwd";

export default function CodeReview() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [stats, setStats] = useState({ fileCount: 0 });

  // SSH profile ativo
  const sshProfile = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    if (!ws?.activeSSHProfileId) return null;
    return ws.sshProfiles.find((p) => p.id === ws.activeSSHProfileId) ?? null;
  });

  // CWD reativo do pane ativo
  const activeTerminalTabId = useWorkspaceStore((s) => {
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    if (!ws) return null;
    const ps = ws.paneStates[ws.activePaneId];
    const tab = ps?.tabs.find((t) => t.id === ps?.activeTabId);
    return tab?.type === "terminal" ? tab.terminalTabId : null;
  });

  const rawCwd = useTerminalStore((s) => {
    if (!activeTerminalTabId) return "~";
    return s.tabs.find((t) => t.id === activeTerminalTabId)?.cwd || "~";
  });

  const cwd = useRemoteCwd(rawCwd, sshProfile);

  const gitInfo = useGitStatus(cwd, sshProfile);

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 12px",
        borderBottom: "1px solid var(--panel-border)",
        background: "var(--panel-header-bg)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 21V8a2 2 0 0 0-2-2h-5" />
          <path d="M6 3v13a2 2 0 0 0 2 2h5" />
          <path d="M15 3l-4 3 4 3" />
          <path d="M9 21l4-3-4-3" />
        </svg>
        <span style={{
          fontSize: "var(--font-size-xs)",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          letterSpacing: "0.08em",
          fontFamily: "var(--font-display)",
        }}>
          CODE REVIEW
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-accent-light)",
          fontFamily: "var(--font-mono)",
        }}>
          {gitInfo?.branch || "..."}
        </span>
      </div>

      {/* Content: file list + diff */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Changed files list */}
        <div style={{
          width: "200px",
          borderRight: "1px solid var(--panel-border)",
          overflow: "auto",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ flex: 1, overflow: "auto" }}>
            <ChangedFileList
              cwd={cwd}
              sshProfile={sshProfile}
              onSelectFile={setSelectedFile}
              selectedFile={selectedFile}
              onStatsChange={setStats}
            />
          </div>

          {/* Summary */}
          <div style={{
            padding: "8px 12px",
            borderTop: "1px solid var(--panel-border)",
            display: "flex",
            gap: "10px",
            fontSize: "var(--font-size-xs)",
            fontFamily: "var(--font-mono)",
            background: "var(--panel-header-bg)",
            flexShrink: 0,
          }}>
            <span style={{ color: "var(--color-text-faint)", marginLeft: "auto" }}>
              {stats.fileCount} files
            </span>
          </div>
        </div>

        <DiffView cwd={cwd} filePath={selectedFile} sshProfile={sshProfile} />
      </div>
    </div>
  );
}
