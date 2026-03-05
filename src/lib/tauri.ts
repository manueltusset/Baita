import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  RetentionConfig,
  DbStats,
  SSHProfile,
  FileEntry,
} from "./types";

// -- PTY --

export async function tabCreate(cwd?: string, shell?: string, shellArgs?: string[]) {
  return invoke<{ id: string; label: string; shell: string; cwd: string }>(
    "tab_create",
    { cwd, shell, shellArgs },
  );
}

export async function tabClose(tabId: string) {
  return invoke("tab_close", { tabId });
}

export async function ptyWrite(tabId: string, data: Uint8Array) {
  return invoke("pty_write", { tabId, data: Array.from(data) });
}

export async function ptyResize(tabId: string, cols: number, rows: number) {
  return invoke("pty_resize", { tabId, cols, rows });
}

// -- Filesystem --

export async function readDirectory(path: string) {
  return invoke<FileEntry[]>("read_directory", { path });
}

export async function readFile(path: string) {
  return invoke<{ path: string; content: string; language: string }>(
    "read_file",
    { path },
  );
}

export async function writeFile(path: string, content: string) {
  return invoke("write_file", { path, content });
}

// -- Git --

export async function gitStatus(path: string) {
  return invoke<{
    branch: string;
    is_dirty: boolean;
    staged: { path: string; status: string }[];
    unstaged: { path: string; status: string }[];
    untracked: string[];
  }>("git_status", { path });
}

export async function gitDiff(path: string) {
  return invoke<string>("git_diff", { path });
}

export async function gitDiffFile(path: string, filePath: string) {
  return invoke<{ path: string; content: string }>("git_diff_file", {
    path,
    filePath,
  });
}

// -- Settings --

export async function getRetentionConfig() {
  return invoke<RetentionConfig>("get_retention_config");
}

export async function setRetentionConfig(config: RetentionConfig) {
  return invoke("set_retention_config", { config });
}

export async function getDbStats() {
  return invoke<DbStats>("get_db_stats");
}

export async function runCleanupNow() {
  return invoke<{ purged: number; deleted: number }>("run_cleanup_now");
}

// -- System Metrics --

export async function getSystemMetrics() {
  return invoke<{
    cpu_usage: number;
    memory_used: number;
    memory_total: number;
    swap_used: number;
    swap_total: number;
    cpu_count: number;
    disk_used: number;
    disk_total: number;
    uptime: number;
  }>("get_system_metrics");
}

// -- SSH --

export async function sshExec(profile: SSHProfile, command: string) {
  return invoke<string>("ssh_exec", {
    host: profile.host,
    port: profile.port,
    username: profile.username,
    authMethod: profile.authMethod,
    keyPath: profile.keyPath,
    command,
  });
}

export async function sshListProfiles() {
  return invoke<SSHProfile[]>("ssh_list_profiles");
}

export async function sshSaveProfile(profile: SSHProfile) {
  return invoke("ssh_save_profile", { profile });
}

export async function sshDeleteProfile(id: string) {
  return invoke("ssh_delete_profile", { id });
}

// -- Lifecycle --

export async function tabHibernate(tabId: string) {
  return invoke("tab_hibernate", { tabId });
}

export async function tabSuspend(tabId: string) {
  return invoke("tab_suspend", { tabId });
}

export async function tabRestore(tabId: string) {
  return invoke<string[]>("tab_restore", { tabId });
}

export async function tabGetState(tabId: string) {
  return invoke<string>("tab_get_state", { tabId });
}

// -- Buffer Persistence --

export async function ptySaveBuffer(tabId: string, data: string) {
  return invoke("pty_save_buffer", { tabId, data });
}

export async function ptyGetBuffer(tabId: string) {
  return invoke<string | null>("pty_get_buffer", { tabId });
}

// -- Events --

export function onPtyOutput(
  callback: (event: { tab_id: string; data: number[] }) => void,
) {
  return listen<{ tab_id: string; data: number[] }>("pty_output", (e) =>
    callback(e.payload),
  );
}

export function onCwdChanged(
  callback: (event: { tab_id: string; cwd: string }) => void,
) {
  return listen<{ tab_id: string; cwd: string }>("cwd_changed", (e) =>
    callback(e.payload),
  );
}

export function onTabState(
  callback: (event: { tab_id: string; state: string }) => void,
) {
  return listen<{ tab_id: string; state: string }>("tab_state", (e) =>
    callback(e.payload),
  );
}
