<p align="center">
  <img src="src/assets/logo.png" alt="Baita Terminal" width="120" />
</p>

<h1 align="center">Baita Terminal</h1>

<p align="center">
  Terminal moderno de alta performance com workspaces, pane splits, file viewer, code review, metricas de sistema e SSH integrado.
</p>

<p align="center">
  <strong>Tauri 2 + React 19 + Rust + SQLite</strong>
</p>

---

## Sobre

Baita Terminal e um emulador de terminal de nova geracao, inspirado no Warp, construido como aplicacao desktop nativa com Tauri 2. Combina a performance do Rust no backend (PTY, storage, git, sysinfo) com uma interface React moderna e responsiva.

Cada comando executado gera um "block" independente com metadados (exit code, branch, duracao, CWD), que pode ser recolhido, fixado ou buscado. O historico e persistido em SQLite com compressao zstd e busca full-text (FTS5).

## Arquitetura

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

## Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Tauri | 2.10 |
| Frontend | React + TypeScript | 19 / 5.x |
| Terminal | xterm.js (WebGL2) | 6.x |
| Estado | Zustand | 5.x |
| Syntax | Shiki | 4.x |
| Charts | Recharts | 3.x |
| Virtual Scroll | TanStack Virtual | 3.x |
| System Info | sysinfo | 0.35 |
| PTY | portable-pty | 0.9 |
| Database | SQLite (WAL) via sqlx | 0.8 |
| Compressao | zstd | 0.13 |
| Cache | LRU | 0.12 |
| Git | git2 (libgit2) | 0.19 |
| Build | Vite | 7.x |

## Features

### Workspaces e Pane Splits
- Multiplos workspaces com tabs na TopBar
- Pane tree com splits horizontais e verticais (ate 4 paineis)
- Cada pane suporta tabs internas: terminal, editor, code review, SSH
- Layout padrao configuravel nas settings (numero de paineis, direcao, comandos iniciais)

### Terminal Block-Based
- Cada comando gera um block com metadados: exit code, CWD, branch git, duracao, contagem de linhas
- Blocks podem ser fixados (pin), copiados e recolhidos
- Historico com busca full-text (SQLite FTS5)
- Output comprimido com zstd para economia de espaco
- LRU cache de 30 blocks por aba para acesso rapido

### File Explorer
- Arvore de arquivos recursiva com icones coloridos por extensao
- Sincronizacao automatica com CWD do terminal (via OSC 7)
- Busca integrada por nome de arquivo

### File Viewer / Editor
- Syntax highlighting com Shiki (mesma engine do VS Code)
- Tabs de arquivos abertos
- Leitura e escrita de arquivos via Tauri IPC

### Code Review (Git Diff)
- Visualizacao de diff em formato unified (estilo GitHub)
- Lista de arquivos alterados com status (added/modified/deleted)
- Integrado com git2 crate (nao depende de git CLI)
- Sumario de linhas adicionadas/removidas

### System Metrics
- Monitoramento em tempo real: CPU, memoria, disco
- Badges compactos na TopBar (dot colorido + percentual)
- Dropdown com charts historicos (Recharts AreaChart)
- Seletor de time range: 5m / 15m / 30m / 1h
- Detalhes: cores, RAM, swap, disco, uptime
- Backend via `sysinfo` crate, polling a cada 5s

### SSH Manager
- Perfis de conexao salvos por workspace
- Dropdown com lista de profiles, connect/disconnect
- Dialog de conexao com suporte a agent, chave SSH ou senha
- Indicador de status na workspace tab

### TopBar (Glass Pill Island)
- Ilha glass centralizada no topo com pill shape
- Workspace tabs + action buttons + metric badges
- Click nos icones abre dropdown popup glass alinhado abaixo (estilo macOS)
- Dropdowns: Settings, SSH, Metrics
- `data-tauri-drag-region` para arrastar a janela
- Always visible (sem hover expand/collapse)

### Tab Lifecycle
- **Active**: tab em uso, React montado, PTY ativo
- **Hibernated**: apos 2 min inativo, React desmontado, PTY continua com ring buffer (1000 linhas)
- **Suspended**: apos 30 min inativo, processo pausado (SIGSTOP)
- Restauracao automatica com dreno do ring buffer
- Verificacao periodica a cada 30 segundos

### Cleanup Automatico
- Job periodico que roda na hora configurada (padrao: 3h)
- Purga output de blocks antigos (padrao: 7 dias)
- Deleta blocks expirados (padrao: 90 dias)
- Remove sessoes antigas (padrao: 30 dias)
- Enforce de tamanho maximo do banco (padrao: 500MB)
- Vacuum incremental automatico

### Design System
- Glass morphism com backdrop blur
- Tema dark (padrao) e light
- Accent orange (#ec5b13)
- Fontes: JetBrains Mono NF (codigo) + Public Sans (display)
- Animacoes: fadeSlideIn, scaleIn, pulse, shimmer
- Custom titlebar overlay macOS
- CSS variables para theming completo

### Atalhos de Teclado

| Atalho | Acao |
|--------|------|
| `Ctrl+K` | Command palette |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+,` | Abrir settings dropdown |
| `Ctrl+T` | Novo workspace |
| `Ctrl+W` | Fechar tab do pane ativo |
| `Ctrl+S` | Salvar arquivo no editor |
| `Ctrl+1-9` | Navegar workspaces |
| `Ctrl+Shift+H` | Split horizontal |
| `Ctrl+Shift+V` | Split vertical |

## Estrutura do Projeto

```
baita/
  src/                            # Frontend React
    App.tsx                       # Layout principal
    components/                   # 31 componentes organizados
      nav/                        # TopBar, NavTab, DropdownPopup
      sidebar/                    # Sidebar, FileExplorer, FileTreeNode, ReviewSidebar
      terminal/                   # PaneContainer, SplitHandle
      pane/                       # PaneLeafContainer, PaneTabBar, PaneTabContent,
                                  # TerminalContent, TerminalStatusBar
      editor/                     # FileViewer, EditorTabs
      review/                     # CodeReview, DiffView, ChangedFileList
      metrics/                    # MetricsPopup
      settings/                   # SettingsDropdown, RetentionSlider
      ssh/                        # SSHDropdown, SSHManager, SSHProfileList, SSHConnectDialog
      shared/                     # GlassPanel, IconButton, MaterialIcon
      titlebar/                   # MemoryIndicator, Tab, WindowControls
    hooks/                        # 9 hooks customizados
      useTerminal.ts              # Gerencia xterm.js + cache de instancias
      useSystemMetrics.ts         # Polling de metricas do sistema
      useKeyboard.ts              # Atalhos de teclado globais
      useTabLifecycle.ts          # Lifecycle de tabs (hibernate/suspend)
      useFileTree.ts              # Arvore de arquivos
      useGitStatus.ts             # Status git do workspace
      useShikiHighlighter.ts      # Syntax highlighting
      useRemoteCwd.ts             # CWD tracking
      useTauriEvent.ts            # Listener de eventos Tauri
    stores/                       # 7 Zustand stores
      workspaceStore.ts           # Workspaces, pane trees, pane tabs
      uiStore.ts                  # Sidebar, settings, commandPalette, review
      terminalStore.ts            # Registry global de sessoes PTY
      editorStore.ts              # Registry global de arquivos abertos
      metricsStore.ts             # Historico de metricas do sistema
      settingsStore.ts            # Configuracoes persistidas (theme, retention, layout)
      sshStore.ts                 # Estado do dialog SSH
    lib/                          # Types, constants, Tauri bridge
      tauri.ts                    # Wrapper tipado para invoke/listen
      types.ts                    # Interfaces compartilhadas
      constants.ts                # Atalhos e constantes
      paneTree.ts                 # Utilitarios de pane tree
      ssh.ts                      # Helpers SSH
    styles/                       # Theme + global CSS
      theme.css                   # CSS variables (dark + light)
      global.css                  # Reset, animacoes, classes globais

  src-tauri/                      # Backend Rust
    src/
      lib.rs                      # Setup Tauri + lifecycle + cleanup loops
      commands/                   # 25 comandos IPC
        pty.rs                    # tab_create, tab_close, pty_write, pty_resize,
                                  # pty_save_buffer, pty_get_buffer
        lifecycle.rs              # tab_hibernate, tab_suspend, tab_restore, tab_get_state
        filesystem.rs             # read_directory, read_file, write_file
        git.rs                    # git_status, git_diff, git_diff_file
        settings.rs               # get/set retention, db_stats, cleanup
        ssh.rs                    # ssh_exec, ssh profiles CRUD
        sysinfo.rs                # get_system_metrics (CPU, RAM, swap, disco, uptime)
      pty/                        # Gerenciamento de PTY
        manager.rs                # PtyManager com lifecycle + ring buffer
        session.rs                # PtySession (portable-pty + OSC 7 env)
        cwd_tracker.rs            # Parser OSC 7
      storage/                    # Persistencia
        database.rs               # SQLite WAL + migrations + FTS5
        models.rs                 # Structs Rust
        cache.rs                  # LRU cache
      state/                      # Estado global
        app_state.rs              # Arc<Mutex<PtyManager>> + Arc<Database>
```

## Instalacao

### Pre-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) (stable)
- Dependencias do Tauri: veja [prerequisites](https://v2.tauri.app/start/prerequisites/)

### Setup

```bash
# Clonar repositorio
git clone <repo-url> baita
cd baita

# Instalar dependencias
npm install

# Rodar em modo desenvolvimento
npm run tauri dev
```

### Build de Producao

```bash
npm run tauri build
```

O binario sera gerado em `src-tauri/target/release/bundle/`.

## Configuracoes

As configuracoes podem ser ajustadas pelo dropdown de settings (`Ctrl+,`):

| Configuracao | Padrao | Descricao |
|-------------|--------|-----------|
| Theme | dark | Tema visual (dark / light) |
| Output Retention | 7 dias | Tempo antes de purgar output dos blocks |
| Command Retention | 90 dias | Tempo antes de deletar blocks |
| Session Retention | 30 dias | Tempo antes de deletar sessoes |
| Max DB Size | 500 MB | Tamanho maximo do banco SQLite |
| Default Layout | 1 panel | Numero de paineis e direcao ao criar workspace |

## IPC e Eventos

### Comandos (Frontend -> Backend)

O frontend invoca comandos Rust via `@tauri-apps/api/core`:

- **PTY**: `tab_create`, `tab_close`, `pty_write`, `pty_resize`, `pty_save_buffer`, `pty_get_buffer`
- **Lifecycle**: `tab_hibernate`, `tab_suspend`, `tab_restore`, `tab_get_state`
- **Filesystem**: `read_directory`, `read_file`, `write_file`
- **Git**: `git_status`, `git_diff`, `git_diff_file`
- **Settings**: `get_retention_config`, `set_retention_config`, `get_db_stats`, `run_cleanup_now`
- **SSH**: `ssh_exec`, `ssh_list_profiles`, `ssh_save_profile`, `ssh_delete_profile`
- **System**: `get_system_metrics`

### Eventos (Backend -> Frontend)

O backend emite eventos via `tauri::Emitter`:

- `pty_output` - Output do terminal (batched a cada 16ms)
- `cwd_changed` - Mudanca de diretorio detectada (OSC 7)
- `tab_state` - Mudanca de estado no lifecycle (hibernated/suspended)

## Performance

- **IPC Batching**: Output do PTY e agrupado em janelas de 16ms (~60fps)
- **WebGL2 Renderer**: xterm.js usa GPU para renderizacao do terminal
- **SQLite WAL Mode**: Leituras e escritas concorrentes sem bloqueio
- **LRU Cache**: 30 blocks mais recentes em memoria por aba
- **zstd Compression**: Output dos blocks comprimido antes de persistir
- **Tab Lifecycle**: Tabs inativas liberam recursos progressivamente
- **Ring Buffer**: 1000 linhas em memoria durante hibernacao (sem perda de dados)
- **Metrics Polling**: sysinfo a cada 5s com historico circular (720 pontos = 1h)
- **PRAGMA Otimizados**: cache_size 32MB, mmap 256MB, temp_store MEMORY

## Licenca

MIT
