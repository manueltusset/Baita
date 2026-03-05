import { create } from "zustand";
import type { TabInfo, TabState } from "@/lib/types";

interface TerminalState {
  tabs: TabInfo[];
  activeTabId: string;

  setActiveTab: (id: string) => void;
  addTab: (tab: TabInfo) => void;
  removeTab: (id: string) => void;
  setCwd: (tabId: string, cwd: string) => void;
  setTabState: (tabId: string, state: TabState) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  tabs: [],
  activeTabId: "",

  setActiveTab: (id) => set({ activeTabId: id }),
  setCwd: (tabId, cwd) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, cwd } : t)),
    })),
  addTab: (tab) => set((s) => ({ tabs: [...s.tabs, tab] })),
  removeTab: (id) => set((s) => ({ tabs: s.tabs.filter((t) => t.id !== id) })),
  setTabState: (tabId, state) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, state } : t)),
    })),
}));
