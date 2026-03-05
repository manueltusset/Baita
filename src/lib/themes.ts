export interface ThemeDefinition {
  id: string;
  name: string;
  isDark: boolean;
  preview: { bg: string; accent: string; text: string };
  vars: Record<string, string>;
}

// Helpers para derivar variaveis de cor
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Gera todas as CSS vars a partir de cores base
function buildDarkTheme(p: {
  bg: string;
  bgElevated: string;
  accent: string;
  accentLight: string;
  accentLighter: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  glassBg: string;
}): Record<string, string> {
  return {
    "--color-bg": p.bg,
    "--color-bg-elevated": p.bgElevated,
    "--color-surface": rgba("#ffffff", 0.04),
    "--color-surface-hover": rgba("#ffffff", 0.06),
    "--color-surface-active": rgba("#ffffff", 0.08),
    "--color-border": rgba("#ffffff", 0.05),
    "--color-border-hover": rgba("#ffffff", 0.08),
    "--color-border-focus": rgba(p.accent, 0.5),
    "--color-accent": p.accent,
    "--color-accent-light": p.accentLight,
    "--color-accent-lighter": p.accentLighter,
    "--color-accent-dim": rgba(p.accent, 0.15),
    "--color-accent-border": rgba(p.accent, 0.25),
    "--color-accent-glow": rgba(p.accent, 0.12),
    "--color-success": p.success,
    "--color-error": p.error,
    "--color-warning": p.warning,
    "--color-info": p.info,
    "--color-text": p.text,
    "--color-text-secondary": p.textSecondary,
    "--color-text-muted": p.textMuted,
    "--color-text-faint": p.textFaint,
    "--glass-bg": rgba(p.glassBg, 0.7),
    "--glass-bg-elevated": rgba(p.glassBg, 0.5),
    "--glass-border": rgba("#ffffff", 0.1),
    "--glass-border-highlight": rgba("#ffffff", 0.15),
    "--glass-shine": rgba("#ffffff", 0.04),
    "--glass-glow-accent": rgba(p.accent, 0.15),
    "--glass-blur": "blur(20px) saturate(1.4)",
    "--glass-blur-elevated": "blur(12px) saturate(1.2)",
    "--glass-shadow": `0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
    "--glass-shadow-elevated": `0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
    "--titlebar-bg": "rgba(0,0,0,0.3)",
    "--shadow-sm": "0 1px 3px rgba(0,0,0,0.2)",
    "--shadow-md": "0 4px 16px rgba(0,0,0,0.3)",
    "--shadow-lg": "0 12px 40px rgba(0,0,0,0.4)",
    "--shadow-xl": "0 20px 60px rgba(0,0,0,0.5)",
    "--panel-bg": "transparent",
    "--panel-header-bg": "rgba(0,0,0,0.15)",
    "--panel-border": rgba("#ffffff", 0.04),
    "--input-bg": rgba("#ffffff", 0.04),
    "--input-bg-focus": rgba("#ffffff", 0.06),
    "--input-border": rgba("#ffffff", 0.08),
    "--input-border-focus": rgba(p.accent, 0.5),
    "--diff-add-bg": rgba(p.success, 0.05),
    "--diff-add-border": rgba(p.success, 0.35),
    "--diff-add-text": rgba(p.success, 0.75),
    "--diff-remove-bg": rgba(p.error, 0.05),
    "--diff-remove-border": rgba(p.error, 0.35),
    "--diff-remove-text": rgba(p.error, 0.7),
    "--diff-header-bg": rgba(p.info, 0.05),
    "--diff-line-number": p.textFaint,
    "--overlay-bg": "rgba(0,0,0,0.55)",
    "--overlay-blur": "blur(8px)",
    "--blob-accent": rgba(p.accent, 0.06),
    "--blob-cool": rgba(p.info, 0.04),
  };
}

function buildLightTheme(p: {
  bg: string;
  bgElevated: string;
  accent: string;
  accentLight: string;
  accentLighter: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  glassBg: string;
}): Record<string, string> {
  return {
    "--color-bg": p.bg,
    "--color-bg-elevated": p.bgElevated,
    "--color-surface": rgba("#000000", 0.03),
    "--color-surface-hover": rgba("#000000", 0.05),
    "--color-surface-active": rgba("#000000", 0.07),
    "--color-border": rgba("#000000", 0.08),
    "--color-border-hover": rgba("#000000", 0.12),
    "--color-border-focus": rgba(p.accent, 0.5),
    "--color-accent": p.accent,
    "--color-accent-light": p.accentLight,
    "--color-accent-lighter": p.accentLighter,
    "--color-accent-dim": rgba(p.accent, 0.08),
    "--color-accent-border": rgba(p.accent, 0.18),
    "--color-accent-glow": rgba(p.accent, 0.06),
    "--color-success": p.success,
    "--color-error": p.error,
    "--color-warning": p.warning,
    "--color-info": p.info,
    "--color-text": p.text,
    "--color-text-secondary": p.textSecondary,
    "--color-text-muted": p.textMuted,
    "--color-text-faint": p.textFaint,
    "--glass-bg": rgba(p.glassBg, 0.55),
    "--glass-bg-elevated": rgba(p.glassBg, 0.5),
    "--glass-border": rgba("#000000", 0.06),
    "--glass-border-highlight": rgba("#000000", 0.1),
    "--glass-shine": rgba("#ffffff", 0.6),
    "--glass-glow-accent": rgba(p.accent, 0.12),
    "--glass-blur": "blur(20px) saturate(1.4)",
    "--glass-blur-elevated": "blur(12px) saturate(1.2)",
    "--glass-shadow": `0 8px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)`,
    "--glass-shadow-elevated": `0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)`,
    "--titlebar-bg": "rgba(255,255,255,0.6)",
    "--shadow-sm": "0 1px 3px rgba(0,0,0,0.06)",
    "--shadow-md": "0 4px 16px rgba(0,0,0,0.08)",
    "--shadow-lg": "0 12px 40px rgba(0,0,0,0.1)",
    "--shadow-xl": "0 20px 60px rgba(0,0,0,0.12)",
    "--panel-bg": rgba("#ffffff", 0.5),
    "--panel-header-bg": rgba("#000000", 0.02),
    "--panel-border": rgba("#000000", 0.06),
    "--input-bg": rgba("#000000", 0.03),
    "--input-bg-focus": rgba("#000000", 0.04),
    "--input-border": rgba("#000000", 0.1),
    "--input-border-focus": rgba(p.accent, 0.4),
    "--diff-add-bg": rgba(p.success, 0.06),
    "--diff-add-border": rgba(p.success, 0.3),
    "--diff-add-text": rgba(p.success, 0.8),
    "--diff-remove-bg": rgba(p.error, 0.06),
    "--diff-remove-border": rgba(p.error, 0.3),
    "--diff-remove-text": rgba(p.error, 0.75),
    "--diff-header-bg": rgba(p.info, 0.05),
    "--diff-line-number": p.textFaint,
    "--overlay-bg": "rgba(0,0,0,0.3)",
    "--overlay-blur": "blur(8px)",
    "--blob-accent": rgba(p.accent, 0.04),
    "--blob-cool": rgba(p.info, 0.03),
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "baita-dark",
    name: "Baita Dark",
    isDark: true,
    preview: { bg: "#0a0a0a", accent: "#ec5b13", text: "#ebebeb" },
    vars: buildDarkTheme({
      bg: "#0a0a0a", bgElevated: "#141418",
      accent: "#ec5b13", accentLight: "#f47a3e", accentLighter: "#f9a06a",
      success: "#4ade80", error: "#f87171", warning: "#fbbf24", info: "#60a5fa",
      text: "rgba(255,255,255,0.92)", textSecondary: "rgba(255,255,255,0.55)",
      textMuted: "rgba(255,255,255,0.35)", textFaint: "rgba(255,255,255,0.20)",
      glassBg: "#191919",
    }),
  },
  {
    id: "baita-light",
    name: "Baita Light",
    isDark: false,
    preview: { bg: "#fafafa", accent: "#d94f0e", text: "#1a1a1a" },
    vars: buildLightTheme({
      bg: "#fafafa", bgElevated: "#ffffff",
      accent: "#d94f0e", accentLight: "#ec5b13", accentLighter: "#f47a3e",
      success: "#16a34a", error: "#dc2626", warning: "#d97706", info: "#2563eb",
      text: "rgba(0,0,0,0.87)", textSecondary: "rgba(0,0,0,0.55)",
      textMuted: "rgba(0,0,0,0.38)", textFaint: "rgba(0,0,0,0.18)",
      glassBg: "#f1f5f9",
    }),
  },
  {
    id: "dracula",
    name: "Dracula",
    isDark: true,
    preview: { bg: "#282a36", accent: "#bd93f9", text: "#f8f8f2" },
    vars: buildDarkTheme({
      bg: "#282a36", bgElevated: "#2d2f3d",
      accent: "#bd93f9", accentLight: "#caa8fb", accentLighter: "#d4bbfc",
      success: "#50fa7b", error: "#ff5555", warning: "#f1fa8c", info: "#8be9fd",
      text: "#f8f8f2", textSecondary: "rgba(248,248,242,0.6)",
      textMuted: "rgba(248,248,242,0.38)", textFaint: "rgba(248,248,242,0.2)",
      glassBg: "#21222c",
    }),
  },
  {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    isDark: true,
    preview: { bg: "#1e1e2e", accent: "#cba6f7", text: "#cdd6f4" },
    vars: buildDarkTheme({
      bg: "#1e1e2e", bgElevated: "#24243a",
      accent: "#cba6f7", accentLight: "#d4b8f9", accentLighter: "#dcc8fb",
      success: "#a6e3a1", error: "#f38ba8", warning: "#f9e2af", info: "#89b4fa",
      text: "#cdd6f4", textSecondary: "rgba(205,214,244,0.6)",
      textMuted: "rgba(205,214,244,0.38)", textFaint: "rgba(205,214,244,0.2)",
      glassBg: "#181825",
    }),
  },
  {
    id: "catppuccin-macchiato",
    name: "Catppuccin Macchiato",
    isDark: true,
    preview: { bg: "#24273a", accent: "#c6a0f6", text: "#cad3f5" },
    vars: buildDarkTheme({
      bg: "#24273a", bgElevated: "#2a2d42",
      accent: "#c6a0f6", accentLight: "#d0b4f8", accentLighter: "#dac6fa",
      success: "#a6da95", error: "#ed8796", warning: "#eed49f", info: "#8aadf4",
      text: "#cad3f5", textSecondary: "rgba(202,211,245,0.6)",
      textMuted: "rgba(202,211,245,0.38)", textFaint: "rgba(202,211,245,0.2)",
      glassBg: "#1e2030",
    }),
  },
  {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    isDark: false,
    preview: { bg: "#eff1f5", accent: "#8839ef", text: "#4c4f69" },
    vars: buildLightTheme({
      bg: "#eff1f5", bgElevated: "#ffffff",
      accent: "#8839ef", accentLight: "#9b4ff5", accentLighter: "#b077f7",
      success: "#40a02b", error: "#d20f39", warning: "#df8e1d", info: "#1e66f5",
      text: "#4c4f69", textSecondary: "rgba(76,79,105,0.65)",
      textMuted: "rgba(76,79,105,0.4)", textFaint: "rgba(76,79,105,0.2)",
      glassBg: "#e6e9ef",
    }),
  },
  {
    id: "nord",
    name: "Nord",
    isDark: true,
    preview: { bg: "#2e3440", accent: "#88c0d0", text: "#eceff4" },
    vars: buildDarkTheme({
      bg: "#2e3440", bgElevated: "#3b4252",
      accent: "#88c0d0", accentLight: "#8fbcbb", accentLighter: "#a3d1d9",
      success: "#a3be8c", error: "#bf616a", warning: "#ebcb8b", info: "#81a1c1",
      text: "#eceff4", textSecondary: "rgba(236,239,244,0.6)",
      textMuted: "rgba(236,239,244,0.38)", textFaint: "rgba(236,239,244,0.2)",
      glassBg: "#272d38",
    }),
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    isDark: true,
    preview: { bg: "#1a1b26", accent: "#7aa2f7", text: "#c0caf5" },
    vars: buildDarkTheme({
      bg: "#1a1b26", bgElevated: "#24283b",
      accent: "#7aa2f7", accentLight: "#89b4fa", accentLighter: "#a4c4fb",
      success: "#9ece6a", error: "#f7768e", warning: "#e0af68", info: "#7dcfff",
      text: "#c0caf5", textSecondary: "rgba(192,202,245,0.6)",
      textMuted: "rgba(192,202,245,0.38)", textFaint: "rgba(192,202,245,0.2)",
      glassBg: "#16161e",
    }),
  },
  {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    isDark: true,
    preview: { bg: "#282828", accent: "#fe8019", text: "#ebdbb2" },
    vars: buildDarkTheme({
      bg: "#282828", bgElevated: "#3c3836",
      accent: "#fe8019", accentLight: "#fabd2f", accentLighter: "#fbc95c",
      success: "#b8bb26", error: "#fb4934", warning: "#fabd2f", info: "#83a598",
      text: "#ebdbb2", textSecondary: "rgba(235,219,178,0.6)",
      textMuted: "rgba(235,219,178,0.38)", textFaint: "rgba(235,219,178,0.2)",
      glassBg: "#1d2021",
    }),
  },
  {
    id: "one-dark",
    name: "One Dark",
    isDark: true,
    preview: { bg: "#282c34", accent: "#61afef", text: "#abb2bf" },
    vars: buildDarkTheme({
      bg: "#282c34", bgElevated: "#2c313a",
      accent: "#61afef", accentLight: "#74baf2", accentLighter: "#8ec7f5",
      success: "#98c379", error: "#e06c75", warning: "#e5c07b", info: "#56b6c2",
      text: "#abb2bf", textSecondary: "rgba(171,178,191,0.6)",
      textMuted: "rgba(171,178,191,0.38)", textFaint: "rgba(171,178,191,0.2)",
      glassBg: "#21252b",
    }),
  },
  {
    id: "rose-pine",
    name: "Rose Pine",
    isDark: true,
    preview: { bg: "#191724", accent: "#c4a7e7", text: "#e0def4" },
    vars: buildDarkTheme({
      bg: "#191724", bgElevated: "#1f1d2e",
      accent: "#c4a7e7", accentLight: "#d0b8ed", accentLighter: "#dcc9f3",
      success: "#9ccfd8", error: "#eb6f92", warning: "#f6c177", info: "#31748f",
      text: "#e0def4", textSecondary: "rgba(224,222,244,0.6)",
      textMuted: "rgba(224,222,244,0.38)", textFaint: "rgba(224,222,244,0.2)",
      glassBg: "#13111e",
    }),
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    isDark: true,
    preview: { bg: "#002b36", accent: "#268bd2", text: "#839496" },
    vars: buildDarkTheme({
      bg: "#002b36", bgElevated: "#073642",
      accent: "#268bd2", accentLight: "#2aa198", accentLighter: "#59c4bd",
      success: "#859900", error: "#dc322f", warning: "#b58900", info: "#6c71c4",
      text: "#839496", textSecondary: "rgba(131,148,150,0.7)",
      textMuted: "rgba(131,148,150,0.45)", textFaint: "rgba(131,148,150,0.25)",
      glassBg: "#001e27",
    }),
  },
];

export const THEME_MAP: Record<string, ThemeDefinition> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);

export const DEFAULT_THEME_ID = "baita-dark";
