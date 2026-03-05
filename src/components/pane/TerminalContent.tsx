import { useEffect, useCallback, useRef } from "react";
import { useTerminal } from "@/hooks/useTerminal";
import { onPtyOutput, ptyWrite, ptyResize } from "@/lib/tauri";

interface TerminalContentProps {
  terminalTabId: string;
  isActive: boolean;
}

export default function TerminalContent({ terminalTabId, isActive }: TerminalContentProps) {
  const handleData = useCallback((data: string) => {
    if (!terminalTabId) return;
    ptyWrite(terminalTabId, new TextEncoder().encode(data)).catch(() => {});
  }, [terminalTabId]);

  const handleResize = useCallback((cols: number, rows: number) => {
    if (!terminalTabId) return;
    ptyResize(terminalTabId, cols, rows).catch(() => {});
  }, [terminalTabId]);

  const { terminalRef, writeOutput, fit, focus } = useTerminal({
    tabId: terminalTabId || "empty",
    onData: handleData,
    onResize: handleResize,
  });

  // Refs estaveis para callbacks (evita re-registro do listener)
  const writeOutputRef = useRef(writeOutput);
  const fitRef = useRef(fit);
  const focusRef = useRef(focus);
  writeOutputRef.current = writeOutput;
  fitRef.current = fit;
  focusRef.current = focus;

  // Escutar output do PTY (dependency apenas no tabId)
  useEffect(() => {
    if (!terminalTabId) return;
    let cancelled = false;
    let unlistenFn: (() => void) | null = null;

    onPtyOutput((event) => {
      if (event.tab_id === terminalTabId) {
        writeOutputRef.current(new Uint8Array(event.data));
      }
    }).then((fn) => {
      if (cancelled) {
        fn();
      } else {
        unlistenFn = fn;
        setTimeout(() => {
          fitRef.current();
          focusRef.current();
        }, 30);
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      unlistenFn?.();
    };
  }, [terminalTabId]);

  // Re-fit e focus quando pane fica ativo
  useEffect(() => {
    if (isActive && terminalTabId) {
      setTimeout(() => {
        fitRef.current();
        focusRef.current();
      }, 50);
    }
  }, [isActive, terminalTabId]);

  if (!terminalTabId) {
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
        Creating terminal...
      </div>
    );
  }

  return (
    <div
      ref={terminalRef}
      style={{
        flex: 1,
        overflow: "hidden",
        padding: "4px",
        minHeight: 0,
      }}
    />
  );
}
