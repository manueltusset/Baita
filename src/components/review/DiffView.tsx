import { useState, useEffect } from "react";
import { gitDiffFile, sshExec } from "@/lib/tauri";
import type { SSHProfile } from "@/lib/types";

interface DiffLine {
  type: "add" | "remove" | "context" | "header";
  lineOld: number | null;
  lineNew: number | null;
  content: string;
}

interface DiffViewProps {
  cwd: string;
  filePath: string | null;
  sshProfile?: SSHProfile | null;
}

// Parsear unified diff em linhas estruturadas
function parseDiffContent(raw: string): DiffLine[] {
  if (!raw) return [];
  const lines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of raw.split("\n")) {
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1]);
        newLine = parseInt(match[2]);
      }
      lines.push({ type: "header", lineOld: null, lineNew: null, content: line });
    } else if (line.startsWith("+")) {
      lines.push({ type: "add", lineOld: null, lineNew: newLine++, content: line.slice(1) });
    } else if (line.startsWith("-")) {
      lines.push({ type: "remove", lineOld: oldLine++, lineNew: null, content: line.slice(1) });
    } else if (line.startsWith(" ")) {
      lines.push({ type: "context", lineOld: oldLine++, lineNew: newLine++, content: line.slice(1) });
    } else if (line.startsWith("diff ") || line.startsWith("index ") || line.startsWith("---") || line.startsWith("+++")) {
      // Ignorar headers do diff
    } else if (line.trim()) {
      lines.push({ type: "context", lineOld: oldLine++, lineNew: newLine++, content: line });
    }
  }
  return lines;
}

export default function DiffView({ cwd, filePath, sshProfile }: DiffViewProps) {
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filePath || !cwd || cwd === "~") {
      setDiffLines([]);
      return;
    }
    setLoading(true);

    const fetch = async () => {
      try {
        let raw: string;

        if (sshProfile) {
          // Tentar diff tracked
          raw = await sshExec(sshProfile, `git -C "${cwd}" diff -- "${filePath}" 2>/dev/null`);
          // Se vazio, pode ser untracked — mostrar conteudo como added
          if (!raw.trim()) {
            const content = await sshExec(sshProfile, `cat "${cwd}/${filePath}" 2>/dev/null`);
            if (content) {
              const lineCount = content.split("\n").length;
              raw = `@@ -0,0 +1,${lineCount} @@\n` +
                content.split("\n").map((l) => `+${l}`).join("\n");
            }
          }
        } else {
          const result = await gitDiffFile(cwd, filePath);
          raw = result.content;
        }

        setDiffLines(parseDiffContent(raw));
      } catch {
        setDiffLines([]);
      }
      setLoading(false);
    };

    fetch();
  }, [cwd, filePath, sshProfile]);

  if (!filePath) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text-faint)",
        fontSize: "var(--font-size-sm)",
        fontFamily: "var(--font-mono)",
      }}>
        Select a file to view the diff
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text-faint)",
        fontSize: "var(--font-size-sm)",
        fontFamily: "var(--font-mono)",
      }}>
        Loading diff...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
      {/* Diff header */}
      <div style={{
        padding: "6px 16px 10px",
        borderBottom: "1px solid var(--panel-border)",
        fontSize: "var(--font-size-sm)",
        fontFamily: "var(--font-mono)",
        color: "var(--color-text-secondary)",
        marginBottom: "4px",
      }}>
        {filePath}
      </div>

      {diffLines.length === 0 && (
        <div style={{
          padding: "16px",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-faint)",
          fontFamily: "var(--font-mono)",
        }}>
          No diff available (file may be untracked)
        </div>
      )}

      {diffLines.map((line, i) => {
        if (line.type === "header") {
          return (
            <div key={i} style={{
              padding: "4px 16px",
              fontSize: "var(--font-size-sm)",
              fontFamily: "var(--font-mono)",
              color: "var(--color-info)",
              background: "var(--diff-header-bg)",
              marginBottom: "2px",
              marginTop: i > 0 ? "8px" : 0,
            }}>
              {line.content}
            </div>
          );
        }

        const isAdd = line.type === "add";
        const isRemove = line.type === "remove";

        return (
          <div
            key={i}
            style={{
              display: "flex",
              fontSize: "var(--font-size-sm)",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.8,
              background: isAdd
                ? "var(--diff-add-bg)"
                : isRemove
                  ? "var(--diff-remove-bg)"
                  : "transparent",
              borderLeft: isAdd
                ? "2px solid var(--diff-add-border)"
                : isRemove
                  ? "2px solid var(--diff-remove-border)"
                  : "2px solid transparent",
            }}
          >
            <span style={{
              width: "36px",
              textAlign: "right",
              paddingRight: "4px",
              color: "var(--diff-line-number)",
              userSelect: "none",
              flexShrink: 0,
            }}>
              {line.lineOld ?? ""}
            </span>
            <span style={{
              width: "36px",
              textAlign: "right",
              paddingRight: "12px",
              color: "var(--diff-line-number)",
              userSelect: "none",
              flexShrink: 0,
            }}>
              {line.lineNew ?? ""}
            </span>

            <span style={{
              width: "16px",
              textAlign: "center",
              color: isAdd
                ? "var(--color-success)"
                : isRemove
                  ? "var(--color-error)"
                  : "transparent",
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {isAdd ? "+" : isRemove ? "-" : " "}
            </span>

            <span style={{
              color: isAdd
                ? "var(--diff-add-text)"
                : isRemove
                  ? "var(--diff-remove-text)"
                  : "var(--color-text-secondary)",
              whiteSpace: "pre",
            }}>
              {line.content}
            </span>
          </div>
        );
      })}
    </div>
  );
}
