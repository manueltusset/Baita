import { useState, useEffect, useRef, useCallback } from "react";
import { getBlocks, searchBlocks, pinBlock } from "@/lib/tauri";
import type { BlockMeta } from "@/lib/types";
import MaterialIcon from "@/components/shared/MaterialIcon";

function relativeTime(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function shortPath(cwd: string | null): string {
  if (!cwd) return "";
  const parts = cwd.split("/").filter(Boolean);
  if (parts.length <= 2) return cwd;
  return parts.slice(-2).join("/");
}

export default function HistoryDropdown() {
  const [blocks, setBlocks] = useState<BlockMeta[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => {
    try {
      const data = await getBlocks(undefined, 50, 0);
      setBlocks(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      debounceRef.current = setTimeout(async () => {
        const data = await getBlocks(undefined, 50, 0);
        setBlocks(data);
      }, 300);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchBlocks(value, 50);
        setBlocks(data);
      } catch {
        // silencioso
      }
    }, 300);
  }, []);

  const handlePin = useCallback(async (id: string, currentPinned: boolean) => {
    try {
      await pinBlock(id, !currentPinned);
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, pinned: !currentPinned } : b)),
      );
    } catch {
      // silencioso
    }
  }, []);

  const handleCopy = useCallback((command: string) => {
    navigator.clipboard.writeText(command);
  }, []);

  // Pinned no topo
  const sorted = [...blocks].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const pinnedCount = sorted.filter((b) => b.pinned).length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          History
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--color-surface-hover)",
            borderRadius: "var(--radius-sm)",
            padding: "3px 6px",
            width: searchFocused || query ? 180 : 100,
            transition: "width 0.2s ease",
            border: searchFocused
              ? "1px solid var(--glass-border-highlight)"
              : "1px solid transparent",
          }}
        >
          <MaterialIcon name="search" size={11} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Filter..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--color-text)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              padding: 0,
              minWidth: 0,
            }}
          />
        </div>
      </div>

      {/* Lista */}
      <div
        style={{
          maxHeight: 320,
          overflowY: "auto",
          margin: "0 -16px",
          padding: "0 16px",
        }}
      >
        {loading && (
          <div
            style={{
              padding: "24px 0",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "11px",
              fontFamily: "var(--font-display)",
            }}
          >
            Loading...
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "11px",
              fontFamily: "var(--font-display)",
            }}
          >
            No commands recorded yet
          </div>
        )}

        {sorted.map((block, i) => (
          <HistoryItem
            key={block.id}
            block={block}
            showPinDivider={block.pinned && i === pinnedCount - 1 && pinnedCount < sorted.length}
            onPin={handlePin}
            onCopy={handleCopy}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryItem({
  block,
  showPinDivider,
  onPin,
  onCopy,
}: {
  block: BlockMeta;
  showPinDivider: boolean;
  onPin: (id: string, pinned: boolean) => void;
  onCopy: (command: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "6px 8px",
          borderRadius: "var(--radius-sm)",
          background: hovered ? "var(--color-surface-hover)" : "transparent",
          borderLeft: block.pinned
            ? "2px solid var(--color-accent)"
            : "2px solid transparent",
          transition: "background var(--transition-fast)",
          cursor: "default",
          position: "relative",
        }}
      >
        {/* Comando + acoes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "11.5px",
              fontWeight: 500,
              color: "var(--color-text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {block.command}
          </span>

          {/* Timestamp / acoes hover */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexShrink: 0,
            }}
          >
            {hovered ? (
              <>
                <SmallBtn
                  icon={block.pinned ? "keep" : "keep_off"}
                  title={block.pinned ? "Unpin" : "Pin"}
                  active={block.pinned}
                  onClick={() => onPin(block.id, block.pinned)}
                />
                <SmallBtn
                  icon="content_copy"
                  title="Copy command"
                  onClick={() => onCopy(block.command)}
                />
              </>
            ) : (
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-muted)",
                  minWidth: 20,
                  textAlign: "right",
                }}
              >
                {relativeTime(block.created_at)}
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
          }}
        >
          {/* Exit code */}
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background:
                block.exit_code === 0 || block.exit_code === null
                  ? "var(--color-success)"
                  : "var(--color-error)",
              flexShrink: 0,
              opacity: 0.8,
            }}
          />

          {/* CWD */}
          {block.cwd && (
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 140,
              }}
            >
              {shortPath(block.cwd)}
            </span>
          )}

          {/* Git branch */}
          {block.git_branch && (
            <span
              style={{
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
                background: "var(--color-surface-active)",
                padding: "1px 5px",
                borderRadius: "var(--radius-sm)",
                whiteSpace: "nowrap",
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {block.git_branch}
            </span>
          )}

          {/* Duracao */}
          {block.duration_ms != null && block.duration_ms > 1000 && (
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
              }}
            >
              {block.duration_ms >= 60000
                ? `${Math.floor(block.duration_ms / 60000)}m${Math.floor((block.duration_ms % 60000) / 1000)}s`
                : `${(block.duration_ms / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>
      </div>

      {/* Divisor entre pinned e nao-pinned */}
      {showPinDivider && (
        <div
          style={{
            height: 1,
            background: "var(--glass-border)",
            margin: "4px 8px",
          }}
        />
      )}
    </>
  );
}

function SmallBtn({
  icon,
  title,
  onClick,
  active,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: "var(--radius-sm)",
        border: "none",
        background: hovered ? "var(--color-surface-active)" : "transparent",
        color: active
          ? "var(--color-accent)"
          : hovered
            ? "var(--color-text-secondary)"
            : "var(--color-text-muted)",
        cursor: "pointer",
        padding: 0,
        transition: "all var(--transition-fast)",
      }}
    >
      <MaterialIcon name={icon} size={12} />
    </button>
  );
}
