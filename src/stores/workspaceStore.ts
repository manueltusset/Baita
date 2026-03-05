import { create } from "zustand";
import type { Workspace, PaneTab, PaneLeafState, PaneNode, PaneTabType, SplitDirection, SSHProfile } from "@/lib/types";
import { splitNodeAt, removeLeaf, updateRatio, countLeaves, findFirstLeaf, generatePaneId } from "@/lib/paneTree";
import { tabCreate, tabClose, ptyWrite } from "@/lib/tauri";
import { useTerminalStore } from "./terminalStore";
import { useSettingsStore } from "./settingsStore";
import { disposeTerminal } from "@/hooks/useTerminal";

let wsCounter = 0;
let paneTabCounter = 0;
let initLock = false;

function generatePaneTabId(): string {
  return `pt-${++paneTabCounter}`;
}

function generateWorkspaceId(): string {
  return `ws-${++wsCounter}`;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;

  addWorkspace: () => Promise<void>;
  removeWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  setWorkspaceCwd: (wsId: string, cwd: string) => void;

  splitPane: (paneId: string, direction: SplitDirection) => void;
  closePane: (paneId: string) => void;
  setActivePaneId: (id: string) => void;
  setPaneRatio: (splitId: string, ratio: number) => void;

  addPaneTab: (paneId: string, tab: PaneTab) => void;
  removePaneTab: (paneId: string, tabId: string) => void;
  setActivePaneTab: (paneId: string, tabId: string) => void;
  updatePaneTab: (paneId: string, tabId: string, updates: Partial<PaneTab>) => void;

  // Inicializa o primeiro workspace com PTY real
  initFirstWorkspace: () => Promise<void>;

  // Encontra workspace que contem um terminalTabId
  findWorkspaceByTerminalTabId: (terminalTabId: string) => Workspace | null;

  // Retorna terminal ativo do pane ativo do workspace ativo
  getActiveTerminalTabId: () => string | null;

  // SSH profiles per workspace
  addSSHProfile: (profile: SSHProfile) => void;
  removeSSHProfile: (profileId: string) => void;

  // SSH connection per workspace
  connectSSH: (profileId: string) => void;
  disconnectSSH: () => void;
  getActiveSSHProfile: () => SSHProfile | null;
}

// Helpers para operar no workspace ativo
function withActiveWorkspace(
  state: { workspaces: Workspace[]; activeWorkspaceId: string },
  fn: (ws: Workspace) => Workspace,
): Workspace[] {
  return state.workspaces.map((ws) =>
    ws.id === state.activeWorkspaceId ? fn(ws) : ws,
  );
}

function withPaneState(
  ws: Workspace,
  paneId: string,
  fn: (ps: PaneLeafState) => PaneLeafState,
): Workspace {
  const ps = ws.paneStates[paneId];
  if (!ps) return ws;
  return {
    ...ws,
    paneStates: { ...ws.paneStates, [paneId]: fn(ps) },
  };
}

// Constroi arvore de panes balanceada para N paineis
function buildPaneTree(count: number, direction: SplitDirection): { root: PaneNode; leafIds: string[] } {
  if (count <= 1) {
    const id = generatePaneId();
    return { root: { type: "leaf", id }, leafIds: [id] };
  }
  const mid = Math.ceil(count / 2);
  const left = buildPaneTree(mid, direction);
  const right = buildPaneTree(count - mid, direction);
  return {
    root: {
      type: "split",
      id: generatePaneId(),
      direction,
      ratio: 0.5,
      children: [left.root, right.root],
    },
    leafIds: [...left.leafIds, ...right.leafIds],
  };
}

// Envia comando para PTY apos breve delay para shell inicializar
function sendAutoCommand(tabId: string, command: string) {
  setTimeout(() => {
    const data = new TextEncoder().encode(command + "\n");
    ptyWrite(tabId, data).catch(() => {});
  }, 600);
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: "",

  initFirstWorkspace: async () => {
    if (initLock) return;
    initLock = true;
    const wsId = generateWorkspaceId();
    const layout = useSettingsStore.getState().defaultLayout;
    const panelCount = Math.max(1, Math.min(4, layout.panels.length));
    const { root: paneRoot, leafIds } = buildPaneTree(panelCount, layout.splitDirection);

    let cwd = "~";
    const paneStates: Record<string, PaneLeafState> = {};

    // Criar PTYs para cada painel
    for (let i = 0; i < leafIds.length; i++) {
      const leafId = leafIds[i];
      const preset = layout.panels[i] ?? {};
      const ptId = generatePaneTabId();

      let terminalTabId = "";
      let shell = "zsh";

      try {
        const result = await tabCreate();
        terminalTabId = result.id;
        if (i === 0) cwd = result.cwd;
        shell = result.shell;

        useTerminalStore.getState().addTab({
          id: result.id,
          label: result.label,
          branch: null,
          state: "active",
          dirty: 0,
          cwd: result.cwd,
          shell: result.shell,
        });
        if (i === 0) useTerminalStore.getState().setActiveTab(result.id);

        if (preset.command) {
          sendAutoCommand(result.id, preset.command);
        }
      } catch {
        terminalTabId = "";
      }

      paneStates[leafId] = {
        tabs: [{ id: ptId, type: "terminal", label: shell, terminalTabId }],
        activeTabId: ptId,
      };
    }

    const workspace: Workspace = {
      id: wsId,
      name: "main",
      cwd,
      paneRoot,
      activePaneId: leafIds[0],
      paneStates,
      sshProfiles: [],
      activeSSHProfileId: null,
    };

    set({ workspaces: [workspace], activeWorkspaceId: wsId });
  },

  addWorkspace: async () => {
    const wsId = generateWorkspaceId();
    const wsNum = get().workspaces.length + 1;
    const layout = useSettingsStore.getState().defaultLayout;
    const panelCount = Math.max(1, Math.min(4, layout.panels.length));
    const { root: paneRoot, leafIds } = buildPaneTree(panelCount, layout.splitDirection);

    let cwd = "~";
    const paneStates: Record<string, PaneLeafState> = {};

    for (let i = 0; i < leafIds.length; i++) {
      const leafId = leafIds[i];
      const preset = layout.panels[i] ?? {};
      const ptId = generatePaneTabId();

      let terminalTabId = "";
      let shell = "zsh";

      try {
        const result = await tabCreate();
        terminalTabId = result.id;
        if (i === 0) cwd = result.cwd;
        shell = result.shell;

        useTerminalStore.getState().addTab({
          id: result.id,
          label: result.label,
          branch: null,
          state: "active",
          dirty: 0,
          cwd: result.cwd,
          shell: result.shell,
        });

        if (preset.command) {
          sendAutoCommand(result.id, preset.command);
        }
      } catch {
        terminalTabId = "";
      }

      paneStates[leafId] = {
        tabs: [{ id: ptId, type: "terminal", label: shell, terminalTabId }],
        activeTabId: ptId,
      };
    }

    const workspace: Workspace = {
      id: wsId,
      name: `workspace ${wsNum}`,
      cwd,
      paneRoot,
      activePaneId: leafIds[0],
      paneStates,
      sshProfiles: [],
      activeSSHProfileId: null,
    };

    set((s) => ({
      workspaces: [...s.workspaces, workspace],
      activeWorkspaceId: wsId,
    }));
  },

  removeWorkspace: (id) => {
    const state = get();
    if (state.workspaces.length <= 1) return;

    // Limpar PTYs do workspace
    const ws = state.workspaces.find((w) => w.id === id);
    if (ws) {
      Object.values(ws.paneStates).forEach((ps) => {
        ps.tabs.forEach((tab) => {
          if (tab.type === "terminal" && tab.terminalTabId) {
            disposeTerminal(tab.terminalTabId);
            tabClose(tab.terminalTabId).catch(() => {});
            useTerminalStore.getState().removeTab(tab.terminalTabId);
          }
        });
      });
    }

    const remaining = state.workspaces.filter((w) => w.id !== id);
    const newActive =
      state.activeWorkspaceId === id
        ? remaining[remaining.length - 1].id
        : state.activeWorkspaceId;

    set({ workspaces: remaining, activeWorkspaceId: newActive });
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  renameWorkspace: (id, name) =>
    set((s) => ({
      workspaces: s.workspaces.map((ws) =>
        ws.id === id ? { ...ws, name } : ws,
      ),
    })),

  setWorkspaceCwd: (wsId, cwd) =>
    set((s) => ({
      workspaces: s.workspaces.map((ws) =>
        ws.id === wsId ? { ...ws, cwd } : ws,
      ),
    })),

  splitPane: (paneId, direction) =>
    set((s) => {
      return {
        workspaces: withActiveWorkspace(s, (ws) => {
          const { newRoot, newLeafId } = splitNodeAt(ws.paneRoot, paneId, direction);
          const ptId = generatePaneTabId();
          return {
            ...ws,
            paneRoot: newRoot,
            activePaneId: newLeafId,
            paneStates: {
              ...ws.paneStates,
              [newLeafId]: {
                // Nova pane comeca com placeholder terminal (PTY criada async)
                tabs: [{ id: ptId, type: "terminal" as PaneTabType, label: "shell", terminalTabId: "" }],
                activeTabId: ptId,
              },
            },
          };
        }),
      };
    }),

  closePane: (paneId) =>
    set((s) => {
      return {
        workspaces: withActiveWorkspace(s, (ws) => {
          if (countLeaves(ws.paneRoot) <= 1) return ws;

          // Limpar PTYs do pane
          const ps = ws.paneStates[paneId];
          if (ps) {
            ps.tabs.forEach((tab) => {
              if (tab.type === "terminal" && tab.terminalTabId) {
                disposeTerminal(tab.terminalTabId);
                tabClose(tab.terminalTabId).catch(() => {});
                useTerminalStore.getState().removeTab(tab.terminalTabId);
              }
            });
          }

          const newRoot = removeLeaf(ws.paneRoot, paneId);
          const newActive =
            ws.activePaneId === paneId
              ? findFirstLeaf(newRoot).id
              : ws.activePaneId;

          const { [paneId]: _, ...remainingStates } = ws.paneStates;
          return {
            ...ws,
            paneRoot: newRoot,
            activePaneId: newActive,
            paneStates: remainingStates,
          };
        }),
      };
    }),

  setActivePaneId: (id) =>
    set((s) => ({
      workspaces: withActiveWorkspace(s, (ws) => ({
        ...ws,
        activePaneId: id,
      })),
    })),

  setPaneRatio: (splitId, ratio) =>
    set((s) => ({
      workspaces: withActiveWorkspace(s, (ws) => ({
        ...ws,
        paneRoot: updateRatio(ws.paneRoot, splitId, Math.min(0.85, Math.max(0.15, ratio))),
      })),
    })),

  addPaneTab: (paneId, tab) =>
    set((s) => ({
      workspaces: withActiveWorkspace(s, (ws) =>
        withPaneState(ws, paneId, (ps) => ({
          tabs: [...ps.tabs, tab],
          activeTabId: tab.id,
        })),
      ),
    })),

  removePaneTab: (paneId, tabId) =>
    set((s) => ({
      workspaces: withActiveWorkspace(s, (ws) => {
        const ps = ws.paneStates[paneId];
        if (!ps || ps.tabs.length <= 1) return ws;

        // Limpar PTY se for terminal
        const tab = ps.tabs.find((t) => t.id === tabId);
        if (tab?.type === "terminal" && tab.terminalTabId) {
          disposeTerminal(tab.terminalTabId);
          tabClose(tab.terminalTabId).catch(() => {});
          useTerminalStore.getState().removeTab(tab.terminalTabId);
        }

        const remaining = ps.tabs.filter((t) => t.id !== tabId);
        const newActive =
          ps.activeTabId === tabId
            ? remaining[remaining.length - 1].id
            : ps.activeTabId;

        return withPaneState(ws, paneId, () => ({
          tabs: remaining,
          activeTabId: newActive,
        }));
      }),
    })),

  setActivePaneTab: (paneId, tabId) =>
    set((s) => ({
      workspaces: withActiveWorkspace(s, (ws) =>
        withPaneState(ws, paneId, (ps) => ({
          ...ps,
          activeTabId: tabId,
        })),
      ),
    })),

  updatePaneTab: (paneId, tabId, updates) =>
    set((s) => ({
      workspaces: withActiveWorkspace(s, (ws) =>
        withPaneState(ws, paneId, (ps) => ({
          ...ps,
          tabs: ps.tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t)),
        })),
      ),
    })),

  findWorkspaceByTerminalTabId: (terminalTabId) => {
    const { workspaces } = get();
    for (const ws of workspaces) {
      for (const ps of Object.values(ws.paneStates)) {
        if (ps.tabs.some((t) => t.terminalTabId === terminalTabId)) {
          return ws;
        }
      }
    }
    return null;
  },

  getActiveTerminalTabId: () => {
    const { workspaces, activeWorkspaceId } = get();
    const ws = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!ws) return null;
    const ps = ws.paneStates[ws.activePaneId];
    if (!ps) return null;
    const activeTab = ps.tabs.find((t) => t.id === ps.activeTabId);
    if (activeTab?.type === "terminal") return activeTab.terminalTabId ?? null;
    // Fallback: encontrar primeiro terminal no pane
    const firstTerminal = ps.tabs.find((t) => t.type === "terminal");
    return firstTerminal?.terminalTabId ?? null;
  },

  addSSHProfile: (profile) =>
    set((s) => ({
      workspaces: withActiveWorkspace(s, (ws) => ({
        ...ws,
        sshProfiles: [...ws.sshProfiles, profile],
      })),
    })),

  removeSSHProfile: (profileId) =>
    set((s) => ({
      workspaces: withActiveWorkspace(s, (ws) => ({
        ...ws,
        sshProfiles: ws.sshProfiles.filter((p) => p.id !== profileId),
        activeSSHProfileId: ws.activeSSHProfileId === profileId ? null : ws.activeSSHProfileId,
      })),
    })),

  connectSSH: (profileId) => {
    const s = get();
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    if (!ws) return;

    const newProfileId = ws.activeSSHProfileId === profileId ? null : profileId;

    // Fechar PTYs existentes para forcar recriacao
    for (const ps of Object.values(ws.paneStates)) {
      for (const tab of ps.tabs) {
        if (tab.type === "terminal" && tab.terminalTabId) {
          disposeTerminal(tab.terminalTabId);
          tabClose(tab.terminalTabId).catch(() => {});
          useTerminalStore.getState().removeTab(tab.terminalTabId);
        }
      }
    }

    // Limpar terminalTabId para forcar recriacao pelo PaneLeafContainer
    set((s2) => ({
      workspaces: withActiveWorkspace(s2, (w) => {
        const newPaneStates: Record<string, PaneLeafState> = {};
        for (const [paneId, ps] of Object.entries(w.paneStates)) {
          newPaneStates[paneId] = {
            ...ps,
            tabs: ps.tabs.map((t) =>
              t.type === "terminal" && t.terminalTabId
                ? { ...t, terminalTabId: "" }
                : t,
            ),
          };
        }
        return { ...w, activeSSHProfileId: newProfileId, paneStates: newPaneStates };
      }),
    }));
  },

  disconnectSSH: () => {
    const s = get();
    const ws = s.workspaces.find((w) => w.id === s.activeWorkspaceId);
    if (!ws || !ws.activeSSHProfileId) return;

    // Fechar PTYs SSH existentes
    for (const ps of Object.values(ws.paneStates)) {
      for (const tab of ps.tabs) {
        if (tab.type === "terminal" && tab.terminalTabId) {
          disposeTerminal(tab.terminalTabId);
          tabClose(tab.terminalTabId).catch(() => {});
          useTerminalStore.getState().removeTab(tab.terminalTabId);
        }
      }
    }

    set((s2) => ({
      workspaces: withActiveWorkspace(s2, (w) => {
        const newPaneStates: Record<string, PaneLeafState> = {};
        for (const [paneId, ps] of Object.entries(w.paneStates)) {
          newPaneStates[paneId] = {
            ...ps,
            tabs: ps.tabs.map((t) =>
              t.type === "terminal" && t.terminalTabId
                ? { ...t, terminalTabId: "" }
                : t,
            ),
          };
        }
        return { ...w, activeSSHProfileId: null, paneStates: newPaneStates };
      }),
    }));
  },

  getActiveSSHProfile: () => {
    const { workspaces, activeWorkspaceId } = get();
    const ws = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!ws?.activeSSHProfileId) return null;
    return ws.sshProfiles.find((p) => p.id === ws.activeSSHProfileId) ?? null;
  },
}));
