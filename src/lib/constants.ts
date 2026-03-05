export const APP_NAME = "Baita Terminal";

export const DEFAULTS = {
  shell: "zsh",
  batchMs: 16,
  lruCacheBlocks: 30,
  scrollbackLines: 5000,
  ringBufferLines: 1000,
  hibernateAfterS: 120,
  suspendAfterS: 1800,
} as const;

export const RETENTION_DEFAULTS: {
  outputDays: number;
  commandDays: number;
  sessionDays: number;
  maxDbMb: number;
  cleanupHour: number;
} = {
  outputDays: 7,
  commandDays: 90,
  sessionDays: 30,
  maxDbMb: 500,
  cleanupHour: 3,
};

export const KEYBOARD_SHORTCUTS = {
  newTab: "Ctrl+T",
  closeTab: "Ctrl+W",
  search: "Ctrl+R",
  palette: "Ctrl+P",
  toggleSidebar: "Ctrl+B",
  toggleSettings: "Ctrl+,",
  splitHorizontal: "Ctrl+Shift+H",
  splitVertical: "Ctrl+Shift+V",
} as const;
