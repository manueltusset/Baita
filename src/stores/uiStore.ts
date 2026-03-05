import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  settingsOpen: boolean;
  showCommandPalette: boolean;
  reviewPanelOpen: boolean;
  reviewPanelWidth: number;

  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  toggleSettings: () => void;
  toggleCommandPalette: () => void;
  toggleReviewPanel: () => void;
  setReviewPanelWidth: (w: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarWidth: 288,
  settingsOpen: false,
  showCommandPalette: false,
  reviewPanelOpen: false,
  reviewPanelWidth: 400,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(500, w)) }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  toggleCommandPalette: () => set((s) => ({ showCommandPalette: !s.showCommandPalette })),
  toggleReviewPanel: () => set((s) => ({ reviewPanelOpen: !s.reviewPanelOpen })),
  setReviewPanelWidth: (w) => set({ reviewPanelWidth: Math.max(280, Math.min(700, w)) }),
}));
