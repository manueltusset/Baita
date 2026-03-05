import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SerializeAddon } from "@xterm/addon-serialize";
import "@xterm/xterm/css/xterm.css";

interface UseTerminalOptions {
  tabId: string;
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
}

interface CachedTerminal {
  terminal: Terminal;
  fitAddon: FitAddon;
  serializeAddon: SerializeAddon;
  dataDisposable?: { dispose: () => void };
  resizeDisposable?: { dispose: () => void };
}

// Cache global: preserva instancias xterm entre trocas de tab
const terminalCache = new Map<string, CachedTerminal>();

const XTERM_THEME = {
  background: "#00000000",
  foreground: "#e4e4e7",
  cursor: "#ec5b13",
  selectionBackground: "#ec5b1330",
  black: "#1e1e21",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  magenta: "#a78bfa",
  cyan: "#22d3ee",
  white: "#e4e4e7",
  brightBlack: "#52525b",
  brightRed: "#fca5a5",
  brightGreen: "#86efac",
  brightYellow: "#fde68a",
  brightBlue: "#93c5fd",
  brightMagenta: "#c4b5fd",
  brightCyan: "#67e8f9",
  brightWhite: "#fafafa",
};

export function useTerminal({ tabId, onData, onResize }: UseTerminalOptions) {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const onDataRef = useRef(onData);
  const onResizeRef = useRef(onResize);

  onDataRef.current = onData;
  onResizeRef.current = onResize;

  useEffect(() => {
    if (!terminalRef.current || !tabId || tabId === "empty") return;
    const container = terminalRef.current;

    let entry = terminalCache.get(tabId);

    if (!entry) {
      container.innerHTML = "";

      const term = new Terminal({
        fontFamily: "JetBrains Mono NF, Space Mono, SF Mono, monospace",
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: "bar",
        theme: XTERM_THEME,
        allowTransparency: true,
        scrollback: 5000,
      });

      const fitAddon = new FitAddon();
      const serializeAddon = new SerializeAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(serializeAddon);
      term.open(container);

      const dataDisposable = term.onData((data) => {
        onDataRef.current?.(data);
      });

      const resizeDisposable = term.onResize(({ cols, rows }) => {
        onResizeRef.current?.(cols, rows);
      });

      entry = { terminal: term, fitAddon, serializeAddon, dataDisposable, resizeDisposable };
      terminalCache.set(tabId, entry);
    } else {
      // Re-attach: mover elemento DOM existente para novo container
      container.innerHTML = "";
      const termElement = entry.terminal.element;
      if (termElement) {
        container.appendChild(termElement);
      } else {
        entry.terminal.open(container);
      }
    }

    requestAnimationFrame(() => {
      entry!.fitAddon.fit();
    });
    xtermRef.current = entry.terminal;
    fitAddonRef.current = entry.fitAddon;

    const observer = new ResizeObserver(() => {
      entry!.fitAddon.fit();
    });
    observer.observe(container);

    return () => {
      // Desanexar elemento do terminal antes do React destruir o container
      const termElement = entry?.terminal.element;
      if (termElement?.parentNode) {
        termElement.parentNode.removeChild(termElement);
      }
      observer.disconnect();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [tabId]);

  const writeOutput = useCallback((data: Uint8Array) => {
    xtermRef.current?.write(data);
  }, []);

  const fit = useCallback(() => {
    fitAddonRef.current?.fit();
  }, []);

  const focus = useCallback(() => {
    xtermRef.current?.focus();
  }, []);

  return { terminalRef, writeOutput, fit, focus };
}

// Serializa buffer do terminal pra persistencia
export function serializeTerminal(tabId: string): string | null {
  const entry = terminalCache.get(tabId);
  if (!entry) return null;
  return entry.serializeAddon.serialize();
}

// Restaura buffer serializado no terminal
export function restoreTerminal(tabId: string, data: string) {
  const entry = terminalCache.get(tabId);
  if (!entry) return;
  entry.terminal.write(data);
}

// Limpar instancia do cache ao fechar tab
export function disposeTerminal(tabId: string) {
  const entry = terminalCache.get(tabId);
  if (entry) {
    entry.dataDisposable?.dispose();
    entry.resizeDisposable?.dispose();
    entry.terminal.dispose();
    terminalCache.delete(tabId);
  }
}
