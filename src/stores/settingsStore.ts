import { create } from "zustand";
import { RETENTION_DEFAULTS } from "@/lib/constants";

type Theme = "dark" | "light";

export interface PanelPreset {
  command?: string;
}

export interface DefaultLayout {
  panels: PanelPreset[];
  splitDirection: "horizontal" | "vertical";
}

const DEFAULT_LAYOUT: DefaultLayout = { panels: [{}], splitDirection: "horizontal" };

interface SettingsState {
  theme: Theme;
  outputDays: number;
  commandDays: number;
  sessionDays: number;
  maxDbMb: number;
  cleanupHour: number;
  dbUsedMb: number;
  defaultLayout: DefaultLayout;

  setTheme: (t: Theme) => void;
  setOutputDays: (v: number) => void;
  setCommandDays: (v: number) => void;
  setSessionDays: (v: number) => void;
  setMaxDbMb: (v: number) => void;
  setDefaultLayout: (layout: DefaultLayout) => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function loadDefaultLayout(): DefaultLayout {
  try {
    const raw = localStorage.getItem("baita-default-layout");
    if (raw) return JSON.parse(raw);
  } catch { /* fallback */ }
  return DEFAULT_LAYOUT;
}

const savedTheme = (localStorage.getItem("baita-theme") as Theme) || "dark";
applyTheme(savedTheme);

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: savedTheme,
  ...RETENTION_DEFAULTS,
  dbUsedMb: 0,
  defaultLayout: loadDefaultLayout(),

  setTheme: (t) => {
    applyTheme(t);
    localStorage.setItem("baita-theme", t);
    set({ theme: t });
  },
  setOutputDays: (v) => set({ outputDays: v }),
  setCommandDays: (v) => set({ commandDays: v }),
  setSessionDays: (v) => set({ sessionDays: v }),
  setMaxDbMb: (v) => set({ maxDbMb: v }),
  setDefaultLayout: (layout) => {
    localStorage.setItem("baita-default-layout", JSON.stringify(layout));
    set({ defaultLayout: layout });
  },
}));
