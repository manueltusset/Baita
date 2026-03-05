import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useEditorStore } from "@/stores/editorStore";

export function useKeyboard() {
  const { toggleSidebar, toggleSettings, toggleCommandPalette } = useUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+K: toggle command palette
      if (ctrl && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Ctrl+S: salvar arquivo no editor
      if (ctrl && e.key === "s") {
        e.preventDefault();
        const ws = useWorkspaceStore.getState();
        const activeWs = ws.workspaces.find((w) => w.id === ws.activeWorkspaceId);
        if (!activeWs) return;
        const ps = activeWs.paneStates[activeWs.activePaneId];
        if (!ps) return;
        const activeTab = ps.tabs.find((t) => t.id === ps.activeTabId);
        if (activeTab?.type === "editor") {
          const { activeFilePath, saveFile } = useEditorStore.getState();
          if (activeFilePath) saveFile(activeFilePath);
        }
        return;
      }

      // Ctrl+B: toggle sidebar
      if (ctrl && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl+,: toggle settings
      if (ctrl && e.key === ",") {
        e.preventDefault();
        toggleSettings();
      }

      // Ctrl+Shift+H: split horizontal
      if (ctrl && e.shiftKey && e.key === "H") {
        e.preventDefault();
        const ws = useWorkspaceStore.getState();
        const activeWs = ws.workspaces.find((w) => w.id === ws.activeWorkspaceId);
        if (activeWs) ws.splitPane(activeWs.activePaneId, "horizontal");
      }

      // Ctrl+Shift+V: split vertical
      if (ctrl && e.shiftKey && e.key === "V") {
        e.preventDefault();
        const ws = useWorkspaceStore.getState();
        const activeWs = ws.workspaces.find((w) => w.id === ws.activeWorkspaceId);
        if (activeWs) ws.splitPane(activeWs.activePaneId, "vertical");
      }

      // Ctrl+T: novo workspace
      if (ctrl && e.key === "t") {
        e.preventDefault();
        useWorkspaceStore.getState().addWorkspace();
      }

      // Ctrl+W: fechar tab do pane ativo
      if (ctrl && e.key === "w") {
        e.preventDefault();
        const ws = useWorkspaceStore.getState();
        const activeWs = ws.workspaces.find((w) => w.id === ws.activeWorkspaceId);
        if (!activeWs) return;
        const ps = activeWs.paneStates[activeWs.activePaneId];
        if (!ps) return;
        if (ps.tabs.length > 1) {
          ws.removePaneTab(activeWs.activePaneId, ps.activeTabId);
        }
      }

      // Ctrl+1-9: alternar workspaces por indice
      if (ctrl && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        const { workspaces, setActiveWorkspace } = useWorkspaceStore.getState();
        if (idx < workspaces.length) {
          setActiveWorkspace(workspaces[idx].id);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar, toggleSettings, toggleCommandPalette]);
}
