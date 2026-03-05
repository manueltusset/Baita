export type TabState = "active" | "background" | "hibernated" | "suspended";

export type ActiveView = "terminal" | "editor";

export type SplitDirection = "horizontal" | "vertical";

export interface PaneLeaf {
  type: "leaf";
  id: string;
}

export interface PaneSplit {
  type: "split";
  id: string;
  direction: SplitDirection;
  children: [PaneNode, PaneNode];
  ratio: number;
}

export type PaneNode = PaneLeaf | PaneSplit;

export interface TabInfo {
  id: string;
  label: string;
  branch: string | null;
  state: TabState;
  dirty: number;
  cwd: string;
  shell: string;
}

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified: number;
}

export interface GitStatus {
  branch: string;
  isDirty: boolean;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: string[];
}

export interface GitFileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
}

export interface FileDiff {
  path: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  oldLineNo: number | null;
  newLineNo: number | null;
}

export interface SSHProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: "key" | "password" | "agent";
  keyPath?: string;
}

// Workspace & Pane tab types
export type PaneTabType = "terminal" | "editor";

export interface PaneTab {
  id: string;
  type: PaneTabType;
  label: string;
  terminalTabId?: string;
  filePath?: string;
}

export interface PaneLeafState {
  tabs: PaneTab[];
  activeTabId: string;
}

export interface Workspace {
  id: string;
  name: string;
  cwd: string;
  paneRoot: PaneNode;
  activePaneId: string;
  paneStates: Record<string, PaneLeafState>;
  sshProfiles: SSHProfile[];
  activeSSHProfileId: string | null;
}

export interface RetentionConfig {
  outputRetentionDays: number;
  commandRetentionDays: number;
  sessionRetentionDays: number;
  maxDbSizeMb: number;
  cleanupHour: number;
}

export interface DbStats {
  sizeBytes: number;
  blockCount: number;
  sessionCount: number;
  lastCleanup: number | null;
}
