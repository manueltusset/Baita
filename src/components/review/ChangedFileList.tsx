import { useState, useEffect } from "react";
import { gitStatus, sshExec } from "@/lib/tauri";
import type { SSHProfile } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  added: "var(--color-success)",
  modified: "var(--color-warning)",
  deleted: "var(--color-error)",
  renamed: "var(--color-info)",
};

const STATUS_LABELS: Record<string, string> = {
  added: "A",
  modified: "M",
  deleted: "D",
  renamed: "R",
};

interface Change {
  path: string;
  status: string;
  additions: number;
  deletions: number;
}

interface ChangedFileListProps {
  cwd: string;
  sshProfile?: SSHProfile | null;
  onSelectFile: (path: string) => void;
  selectedFile: string | null;
  onStatsChange?: (stats: { fileCount: number }) => void;
}

// Parsear output de `git status --porcelain`
function parsePorcelainStatus(output: string): Change[] {
  const changes: Change[] = [];
  for (const line of output.split("\n")) {
    if (!line || line.startsWith("##")) continue;
    const xy = line.slice(0, 2);
    const path = line.slice(3);
    let status = "modified";
    if (xy.includes("A") || xy === "??") status = "added";
    else if (xy.includes("D")) status = "deleted";
    else if (xy.includes("R")) status = "renamed";
    changes.push({ path, status, additions: 0, deletions: 0 });
  }
  return changes;
}

export default function ChangedFileList({ cwd, sshProfile, onSelectFile, selectedFile, onStatsChange }: ChangedFileListProps) {
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    if (!cwd || cwd === "~") {
      setChanges([]);
      onStatsChange?.({ fileCount: 0 });
      return;
    }

    const fetch = async () => {
      try {
        let allChanges: Change[];

        if (sshProfile) {
          const output = await sshExec(sshProfile, `git -C "${cwd}" status --porcelain 2>/dev/null`);
          allChanges = parsePorcelainStatus(output);
        } else {
          const result = await gitStatus(cwd);
          allChanges = [
            ...result.staged.map((f) => ({ path: f.path, status: f.status, additions: 0, deletions: 0 })),
            ...result.unstaged.map((f) => ({ path: f.path, status: f.status, additions: 0, deletions: 0 })),
            ...result.untracked.map((p) => ({ path: p, status: "added", additions: 0, deletions: 0 })),
          ];
        }

        setChanges(allChanges);
        onStatsChange?.({ fileCount: allChanges.length });
      } catch {
        setChanges([]);
        onStatsChange?.({ fileCount: 0 });
      }
    };

    fetch();
  }, [cwd, sshProfile, onStatsChange]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1px",
    }}>
      <div style={{
        padding: "8px 12px",
        fontSize: "var(--font-size-xs)",
        fontWeight: 700,
        color: "var(--color-text-muted)",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.08em",
      }}>
        {changes.length} CHANGED FILES
      </div>

      {changes.length === 0 && (
        <div style={{
          padding: "16px 12px",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-faint)",
          fontFamily: "var(--font-mono)",
        }}>
          No changes detected
        </div>
      )}

      {changes.map((file) => (
        <FileItem
          key={file.path}
          {...file}
          selected={file.path === selectedFile}
          onClick={() => onSelectFile(file.path)}
        />
      ))}
    </div>
  );
}

function FileItem({
  path, status, selected, onClick,
}: {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLORS[status] || "var(--color-text-muted)";
  const label = STATUS_LABELS[status] || "?";
  const fileName = path.split("/").pop();

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        cursor: "pointer",
        background: selected
          ? "var(--color-accent-dim)"
          : hovered
            ? "var(--color-surface)"
            : "transparent",
        borderLeft: selected
          ? "2px solid var(--color-accent)"
          : "2px solid transparent",
        transition: "all var(--transition-fast)",
      }}
    >
      <span style={{
        width: "16px",
        height: "16px",
        borderRadius: "var(--radius-sm)",
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "9px",
        fontWeight: 700,
        color,
        fontFamily: "var(--font-mono)",
        flexShrink: 0,
      }}>
        {label}
      </span>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{
          fontSize: "var(--font-size-sm)",
          fontFamily: "var(--font-mono)",
          color: "var(--color-text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {fileName}
        </div>
        <div style={{
          fontSize: "9px",
          fontFamily: "var(--font-mono)",
          color: "var(--color-text-faint)",
          marginTop: "1px",
        }}>
          {path}
        </div>
      </div>
    </div>
  );
}
