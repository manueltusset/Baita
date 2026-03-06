<p align="center">
  <img src="src/assets/logo.png" alt="Baita Terminal" width="120" />
</p>

<h1 align="center">Baita Terminal</h1>

<p align="center">
  A modern, high-performance terminal emulator with workspaces, pane splits, file viewer, code review, system metrics and built-in SSH.
  <br />
  Built with Tauri v2, React and Rust.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-green" alt="Version 0.1.0" />
  <img src="https://img.shields.io/badge/Tauri-v2-blue" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/Rust-2021-orange" alt="Rust" />
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## What is Baita?

Baita Terminal is a next-generation terminal emulator inspired by Warp, built as a native desktop application with Tauri 2. It combines Rust backend performance (PTY, storage, git, sysinfo) with a modern, responsive React interface.

Every command generates an independent "block" with metadata (exit code, branch, duration, CWD) that can be collapsed, pinned or searched. History is persisted in SQLite with zstd compression and full-text search (FTS5).

## Key Features

### Workspaces & Pane Splits
- **Multiple workspaces** - Tabs in the TopBar with instant switching
- **Pane tree** - Horizontal and vertical splits (up to 4 panels)
- **Internal tabs** - Each pane supports terminal, editor, code review and SSH tabs
- **Configurable layout** - Default panel count, direction and startup commands

### Block-Based Terminal
- **Rich metadata** - Exit code, CWD, git branch, duration and line count per block
- **Pin & collapse** - Pin important blocks and collapse others
- **Full-text search** - SQLite FTS5 across command history
- **zstd compression** - Output compressed before persistence
- **LRU cache** - 30 most recent blocks in memory per tab

### File Explorer
- **Recursive file tree** - Color-coded icons by extension
- **CWD sync** - Automatically follows the active terminal via OSC 7
- **Integrated search** - Filter files by name
- **SSH support** - Browses remote filesystem when connected

### File Viewer / Editor
- **Syntax highlighting** - Shiki (same engine as VS Code)
- **File tabs** - Multiple open files
- **Read & write** - File operations via Tauri IPC

### Code Review (Git Diff)
- **Unified diff** - GitHub-style diff visualization
- **Changed file list** - Status badges (added/modified/deleted)
- **Native git** - Powered by git2 crate (no CLI dependency)
- **Auto-refresh** - Silent polling detects changes from terminal commits

### System Metrics
- **Real-time monitoring** - CPU, memory and disk usage
- **TopBar badges** - Colored dot + percentage at a glance
- **Historical charts** - Recharts AreaChart in a dropdown popup
- **Time range selector** - 5m / 15m / 30m / 1h
- **System details** - Cores, RAM, swap, disk, uptime
- **Backend polling** - `sysinfo` crate every 5s (720 points = 1h)

### SSH Manager
- **Saved profiles** - Per-workspace connection profiles
- **Inline connection form** - Supports agent, SSH key or password auth
- **CWD tracking** - OSC 7 injection into remote shell for directory sync
- **Status indicator** - Active connection badge on workspace tab

### Multi-Theme System
- **12 built-in themes** - Dracula, Catppuccin (Mocha/Macchiato/Latte), Nord, Tokyo Night, Gruvbox, One Dark, Rose Pine, Solarized Dark, Baita Dark, Baita Light
- **JS-based theming** - CSS variables injected via `style.setProperty()` at runtime
- **Persistent selection** - Theme saved to localStorage and applied on boot
- **Glass morphism** - Backdrop blur adapts to each theme's palette

### TopBar (Glass Pill Island)
- **Centered glass pill** - Workspace tabs + action buttons + metric badges
- **Dropdown popups** - Settings, SSH, Metrics (macOS Wi-Fi style)
- **Active state indicators** - Sidebar and review panel icons highlight when open
- **Drag region** - `data-tauri-drag-region` for window dragging

### Tab Lifecycle
- **Active** - Tab in use, React mounted, PTY active
- **Hibernated** - After 2 min idle, React unmounted, PTY continues with ring buffer (1000 lines)
- **Suspended** - After 30 min idle, process paused (SIGSTOP)
- **Auto-restore** - Ring buffer drained on reactivation
- **Periodic check** - Every 30 seconds

### Automatic Cleanup
- **Scheduled job** - Runs at configured hour (default: 3 AM)
- **Output purge** - Blocks older than 7 days (configurable)
- **Block deletion** - Expired commands after 90 days
- **Session removal** - Old sessions after 30 days
- **DB size limit** - Enforced at 500 MB (configurable)
- **Incremental vacuum** - Automatic space reclamation

### Keyboard Shortcuts

| Shortcut | Action |
|----------|-------:|
| `Ctrl+K` | Command palette |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+,` | Open settings dropdown |
| `Ctrl+T` | New workspace |
| `Ctrl+W` | Close active pane tab |
| `Ctrl+S` | Save file in editor |
| `Ctrl+1-9` | Switch workspaces |
| `Ctrl+Shift+H` | Split horizontal |
| `Ctrl+Shift+V` | Split vertical |

## Architecture

```
+-----------------------------------------------------------+
|              [ws1] [ws2] [+] | icons | CPU MEM DISK       |
|              ~~~~ glass pill island (TopBar) ~~~~          |
+--------+--------------------------------------+-----------+
|        |                                      |           |
| File   |   Pane (terminal/editor/ssh tabs)    | Code      |
| Tree   |   +------------------------------+  | Review    |
|        |   | > cargo build --release       |  | Sidebar   |
| .rs    |   | exit:0  ~/baita  feat/ui      |  |           |
| .tsx   |   | Compiling baita-terminal v0.1 |  | diff      |
| .toml  |   | Finished release in 18.4s     |  | view      |
|        |   +------------------------------+  |           |
|        |                                      |           |
|        |   Pane splits (H/V, 1-4 panels)      |           |
+--------+--------------------------------------+-----------+
```

```
Frontend (React 19)            Backend (Rust/Tauri 2)
+--------------------+         +---------------------+
| Components (31)    |  <--->  | PTY Manager         |
| Stores (7)         |   IPC   | Storage (SQLite)    |
| Hooks (9)          |  events | Git (libgit2)       |
| xterm.js v6        |  invoke | Filesystem          |
| Shiki + Recharts   |         | SSH Profiles        |
| TanStack Virtual   |         | Lifecycle Manager   |
+--------------------+         | System Metrics      |
                               +---------------------+
```

## Tech Stack

| Layer | Technology |
|-------|-----------:|
| **Framework** | Tauri v2.10 |
| **Backend** | Rust (2021 edition) |
| **Frontend** | React 19, TypeScript 5.x, Vite 7 |
| **Terminal** | xterm.js 6 (WebGL2) |
| **State** | Zustand 5 |
| **Syntax** | Shiki 4 |
| **Charts** | Recharts 3 |
| **Virtual Scroll** | TanStack Virtual 3 |
| **System Info** | sysinfo 0.35 |
| **PTY** | portable-pty 0.9 |
| **Database** | SQLite (WAL) via sqlx 0.8 |
| **Compression** | zstd 0.13 |
| **Cache** | LRU 0.12 |
| **Git** | git2 (libgit2) 0.19 |

## Project Structure

```
baita/
  src/                            # React frontend
    App.tsx                       # Main layout
    components/                   # 31 organized components
      nav/                        # TopBar, NavTab, DropdownPopup
      sidebar/                    # Sidebar, FileExplorer, FileTreeNode, ReviewSidebar
      terminal/                   # PaneContainer, SplitHandle
      pane/                       # PaneLeafContainer, PaneTabBar, PaneTabContent,
                                  # TerminalContent, TerminalStatusBar
      editor/                     # FileViewer, EditorTabs
      review/                     # CodeReview, DiffView, ChangedFileList
      metrics/                    # MetricsPopup
      settings/                   # SettingsDropdown, RetentionSlider
      ssh/                        # SSHDropdown, SSHProfileList, SSHConnectDialog
      shared/                     # GlassPanel, IconButton, MaterialIcon
    hooks/                        # 9 custom hooks
      useTerminal.ts              # xterm.js management + instance cache
      useSystemMetrics.ts         # System metrics polling
      useKeyboard.ts              # Global keyboard shortcuts
      useTabLifecycle.ts          # Tab lifecycle (hibernate/suspend)
      useGitStatus.ts             # Workspace git status
      useShikiHighlighter.ts      # Syntax highlighting
      useRemoteCwd.ts             # Remote CWD tracking
      useTauriEvent.ts            # Tauri event listener
    stores/                       # 7 Zustand stores
      workspaceStore.ts           # Workspaces, pane trees, pane tabs
      uiStore.ts                  # Sidebar, settings, commandPalette, review
      terminalStore.ts            # Global PTY session registry
      editorStore.ts              # Global open files registry
      metricsStore.ts             # System metrics history
      settingsStore.ts            # Persisted settings (theme, retention, layout)
      sshStore.ts                 # SSH dialog state
    lib/                          # Types, constants, Tauri bridge
      tauri.ts                    # Typed wrapper for invoke/listen
      types.ts                    # Shared interfaces
      constants.ts                # Shortcuts and constants
      themes.ts                   # 12 theme definitions (CSS variable maps)
      paneTree.ts                 # Pane tree utilities
      ssh.ts                      # SSH helpers (OSC 7 injection)
    styles/                       # Theme + global CSS
      theme.css                   # Structural CSS variables (typography, spacing, radius)
      global.css                  # Reset, animations, global classes

  src-tauri/                      # Rust backend
    src/
      lib.rs                      # Tauri setup + lifecycle + cleanup loops
      commands/                   # 25 IPC commands
        pty.rs                    # tab_create, tab_close, pty_write, pty_resize,
                                  # pty_save_buffer, pty_get_buffer
        lifecycle.rs              # tab_hibernate, tab_suspend, tab_restore, tab_get_state
        filesystem.rs             # read_directory, read_file, write_file
        git.rs                    # git_status, git_diff, git_diff_file
        settings.rs               # get/set retention, db_stats, cleanup
        ssh.rs                    # ssh_exec, ssh profiles CRUD
        sysinfo.rs                # get_system_metrics (CPU, RAM, swap, disk, uptime)
      pty/                        # PTY management
        manager.rs                # PtyManager with lifecycle + ring buffer
        session.rs                # PtySession (portable-pty + OSC 7 env)
        cwd_tracker.rs            # OSC 7 parser
      storage/                    # Persistence
        database.rs               # SQLite WAL + migrations + FTS5
        models.rs                 # Rust structs
        cache.rs                  # LRU cache
      state/                      # Global state
        app_state.rs              # Arc<Mutex<PtyManager>> + Arc<Database>
```

## IPC & Events

### Commands (Frontend → Backend)

The frontend invokes Rust commands via `@tauri-apps/api/core`:

| Category | Commands |
|----------|----------|
| **PTY** | `tab_create`, `tab_close`, `pty_write`, `pty_resize`, `pty_save_buffer`, `pty_get_buffer` |
| **Lifecycle** | `tab_hibernate`, `tab_suspend`, `tab_restore`, `tab_get_state` |
| **Filesystem** | `read_directory`, `read_file`, `write_file` |
| **Git** | `git_status`, `git_diff`, `git_diff_file` |
| **Settings** | `get_retention_config`, `set_retention_config`, `get_db_stats`, `run_cleanup_now` |
| **SSH** | `ssh_exec`, `ssh_list_profiles`, `ssh_save_profile`, `ssh_delete_profile` |
| **System** | `get_system_metrics` |

### Events (Backend → Frontend)

| Event | Description |
|-------|------------|
| `pty_output` | Terminal output (batched every 16ms) |
| `cwd_changed` | Directory change detected via OSC 7 |
| `tab_state` | Lifecycle state change (hibernated/suspended) |

## Performance

- **IPC batching** - PTY output grouped in 16ms windows (~60fps)
- **WebGL2 renderer** - xterm.js uses GPU for terminal rendering
- **SQLite WAL mode** - Concurrent reads and writes without blocking
- **LRU cache** - 30 most recent blocks in memory per tab
- **zstd compression** - Block output compressed before persistence
- **Tab lifecycle** - Inactive tabs progressively release resources
- **Ring buffer** - 1000 lines in memory during hibernation (zero data loss)
- **Metrics polling** - sysinfo every 5s with circular history (720 points = 1h)
- **Optimized PRAGMAs** - cache_size 32MB, mmap 256MB, temp_store MEMORY
- **Silent refresh** - Background polling without UI flicker

## Getting Started

### Prerequisites
- [Rust](https://rustup.rs/) (stable toolchain)
- [Node.js](https://nodejs.org/) (v18+)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

### Development

```bash
git clone <repo-url> baita
cd baita
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Artifacts are written to `src-tauri/target/release/bundle/`.

## Settings

Configurable via the settings dropdown (`Ctrl+,`):

| Setting | Default | Description |
|---------|--------:|-----------:|
| Theme | Baita Dark | Visual theme (12 options) |
| Output Retention | 7 days | Time before purging block output |
| Command Retention | 90 days | Time before deleting blocks |
| Session Retention | 30 days | Time before deleting sessions |
| Max DB Size | 500 MB | Maximum SQLite database size |
| Default Layout | 1 panel | Panel count and direction for new workspaces |

## License

MIT
