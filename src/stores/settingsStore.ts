import { create } from "zustand";
import { RETENTION_DEFAULTS } from "@/lib/constants";
import { THEME_MAP, DEFAULT_THEME_ID } from "@/lib/themes";

export interface PanelPreset {
  command?: string;
}

export interface DefaultLayout {
  panels: PanelPreset[];
  splitDirection: "horizontal" | "vertical";
}

const DEFAULT_LAYOUT: DefaultLayout = { panels: [{}], splitDirection: "horizontal" };

interface SettingsState {
  theme: string;
  outputDays: number;
  commandDays: number;
  sessionDays: number;
  maxDbMb: number;
  cleanupHour: number;
  dbUsedMb: number;
  defaultLayout: DefaultLayout;

  setTheme: (id: string) => void;
  setOutputDays: (v: number) => void;
  setCommandDays: (v: number) => void;
  setSessionDays: (v: number) => void;
  setMaxDbMb: (v: number) => void;
  setDefaultLayout: (layout: DefaultLayout) => void;
}

function applyTheme(id: string) {
  const theme = THEME_MAP[id];
  if (!theme) return;
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, value);
  }
}

function loadDefaultLayout(): DefaultLayout {
  try {
    const raw = localStorage.getItem("baita-default-layout");
    if (raw) return JSON.parse(raw);
  } catch { /* fallback */ }
  return DEFAULT_LAYOUT;
}

// Migrar valor antigo "dark"/"light" para novo ID
function migrateThemeId(stored: string | null): string {
  if (stored === "dark") return "baita-dark";
  if (stored === "light") return "baita-light";
  if (stored && THEME_MAP[stored]) return stored;
  return DEFAULT_THEME_ID;
}

const savedTheme = migrateThemeId(localStorage.getItem("baita-theme"));
applyTheme(savedTheme);

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: savedTheme,
  ...RETENTION_DEFAULTS,
  dbUsedMb: 0,
  defaultLayout: loadDefaultLayout(),

  setTheme: (id) => {
    applyTheme(id);
    localStorage.setItem("baita-theme", id);
    set({ theme: id });
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
