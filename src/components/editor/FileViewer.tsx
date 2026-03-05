import { useState, useRef, useCallback, useMemo } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useShikiHighlighter } from "@/hooks/useShikiHighlighter";

// Mapear extensoes para linguagens Shiki
const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
  rs: "rust", py: "python", sh: "bash", bash: "bash",
  json: "json", toml: "toml", css: "css", html: "html",
  yaml: "yaml", yml: "yaml", md: "markdown", go: "go",
  sql: "sql",
};

export default function FileViewer() {
  const { files, activeFilePath, updateContent, saveFile } = useEditorStore();
  const activeFile = files.find((f) => f.path === activeFilePath);
  const [editing, setEditing] = useState(false);
  const highlighter = useShikiHighlighter();
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lang = activeFile
    ? EXT_TO_LANG[activeFile.language] || activeFile.language
    : "text";

  // Gerar HTML com Shiki
  const highlightedHtml = useMemo(() => {
    if (!highlighter || !activeFile) return "";
    try {
      return highlighter.codeToHtml(activeFile.content, {
        lang,
        theme: "github-dark-default",
      });
    } catch {
      // Linguagem nao suportada - fallback
      return "";
    }
  }, [highlighter, activeFile?.content, activeFile?.path, lang]);

  // Sincronizar scroll dos line numbers
  const syncScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeFilePath) return;
    await saveFile(activeFilePath);
    setEditing(false);
  }, [activeFilePath, saveFile]);

  const lineCount = activeFile ? activeFile.content.split("\n").length : 0;

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      border: "1px solid var(--glass-border)",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      background: "transparent",
      animation: "fadeSlideIn 0.15s ease forwards",
    }}>
      {/* Header com acoes */}
      {activeFile && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 12px",
          borderBottom: "1px solid var(--panel-border)",
          background: "var(--panel-header-bg)",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {activeFile.path}
          </span>
          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-xs)",
                  padding: "2px 8px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                style={{
                  background: "var(--color-accent-dim)",
                  border: "1px solid var(--color-accent-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-accent-light)",
                  cursor: "pointer",
                  fontSize: "var(--font-size-xs)",
                  padding: "2px 8px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Save
              </button>
            )}
          </div>
        </div>
      )}

      {activeFile ? (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Line numbers */}
          <div
            ref={lineNumbersRef}
            style={{
              width: "44px",
              overflow: "hidden",
              padding: "10px 0",
              textAlign: "right",
              flexShrink: 0,
              userSelect: "none",
              borderRight: "1px solid var(--glass-border)",
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} style={{
                paddingRight: "10px",
                lineHeight: 1.5,
                fontSize: "var(--font-size-base)",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-faint)",
              }}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* Content area */}
          {editing ? (
            <textarea
              ref={textareaRef}
              value={activeFile.content}
              onChange={(e) => updateContent(activeFile.path, e.target.value)}
              onScroll={syncScroll}
              spellCheck={false}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
                resize: "none",
                padding: "10px 14px",
                overflowY: "auto",
                tabSize: 2,
              }}
            />
          ) : highlightedHtml ? (
            <div
              onDoubleClick={() => setEditing(true)}
              onScroll={(e) => {
                if (lineNumbersRef.current) {
                  lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              className="shiki-container"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px 14px",
                fontSize: "var(--font-size-base)",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.5,
                cursor: "text",
              }}
            />
          ) : (
            // Fallback sem Shiki (loading ou linguagem nao suportada)
            <div
              onDoubleClick={() => setEditing(true)}
              onScroll={(e) => {
                if (lineNumbersRef.current) {
                  lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px 14px",
                cursor: "text",
              }}
            >
              {activeFile.content.split("\n").map((line, i) => (
                <div key={i} style={{
                  lineHeight: 1.5,
                  fontSize: "var(--font-size-base)",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-secondary)",
                  whiteSpace: "pre",
                }}>
                  {line || " "}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-faint)",
          fontSize: "var(--font-size-sm)",
          fontFamily: "var(--font-mono)",
        }}>
          No file open
        </div>
      )}
    </div>
  );
}
