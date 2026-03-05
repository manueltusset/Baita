import { create } from "zustand";
import { writeFile } from "@/lib/tauri";

interface OpenFile {
  path: string;
  name: string;
  language: string;
  content: string;
  modified: boolean;
}

interface EditorState {
  files: OpenFile[];
  activeFilePath: string | null;

  openFile: (file: OpenFile) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  files: [],
  activeFilePath: null,

  openFile: (file) =>
    set((s) => ({
      files: s.files.some((f) => f.path === file.path)
        ? s.files
        : [...s.files, file],
      activeFilePath: file.path,
    })),
  closeFile: (path) =>
    set((s) => {
      const remaining = s.files.filter((f) => f.path !== path);
      return {
        files: remaining,
        activeFilePath:
          s.activeFilePath === path
            ? remaining[remaining.length - 1]?.path ?? null
            : s.activeFilePath,
      };
    }),
  setActiveFile: (path) => set({ activeFilePath: path }),
  updateContent: (path, content) =>
    set((s) => ({
      files: s.files.map((f) =>
        f.path === path ? { ...f, content, modified: true } : f
      ),
    })),
  saveFile: async (path) => {
    const file = get().files.find((f) => f.path === path);
    if (!file) return;
    await writeFile(path, file.content);
    set((s) => ({
      files: s.files.map((f) =>
        f.path === path ? { ...f, modified: false } : f
      ),
    }));
  },
}));
