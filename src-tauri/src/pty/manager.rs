use crate::pty::session::PtySession;
use crate::pty::cwd_tracker;
use crate::storage::database::Database;
use crate::storage::models::Block;
use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct PtyOutputEvent {
    pub tab_id: String,
    pub data: Vec<u8>,
}

#[derive(Clone, Serialize)]
pub struct CwdChangedEvent {
    pub tab_id: String,
    pub cwd: String,
}

#[derive(Clone, Serialize)]
pub struct TabStateEvent {
    pub tab_id: String,
    pub state: String,
}

/// Ring buffer to store output during hibernation
pub struct RingBuffer {
    lines: VecDeque<String>,
    max_lines: usize,
}

impl RingBuffer {
    pub fn new(max_lines: usize) -> Self {
        Self {
            lines: VecDeque::with_capacity(max_lines),
            max_lines,
        }
    }

    pub fn push(&mut self, line: String) {
        if self.lines.len() >= self.max_lines {
            self.lines.pop_front();
        }
        self.lines.push_back(line);
    }

    pub fn drain_all(&mut self) -> Vec<String> {
        self.lines.drain(..).collect()
    }
}

/// Lifecycle state of each tab
#[derive(Debug, Clone, PartialEq)]
pub enum TabLifecycleState {
    Active,
    Hibernated,
    Suspended,
}

/// Lifecycle metadata for each tab
pub struct TabMeta {
    pub state: TabLifecycleState,
    pub last_active: std::time::Instant,
    pub ring_buffer: RingBuffer,
}

/// Manages all active PTY sessions
pub struct PtyManager {
    sessions: HashMap<String, PtySession>,
    tab_meta: HashMap<String, TabMeta>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            tab_meta: HashMap::new(),
        }
    }

    /// Creates a new PTY session and starts reading
    pub fn create_session(
        &mut self,
        tab_id: String,
        shell: &str,
        args: &[String],
        cwd: &str,
        cols: u16,
        rows: u16,
        app_handle: AppHandle,
        db: Arc<Database>,
    ) -> Result<(), String> {
        let (session, output_rx) = PtySession::spawn(
            tab_id.clone(),
            shell,
            args,
            cwd,
            cols,
            rows,
        )?;

        self.sessions.insert(tab_id.clone(), session);
        self.tab_meta.insert(tab_id.clone(), TabMeta {
            state: TabLifecycleState::Active,
            last_active: std::time::Instant::now(),
            ring_buffer: RingBuffer::new(1000),
        });

        let handle = app_handle.clone();
        let tid = tab_id.clone();
        let initial_cwd = cwd.to_string();
        tokio::spawn(async move {
            Self::output_reader_loop(tid, output_rx, handle, db, initial_cwd).await;
        });

        Ok(())
    }

    /// Output reader loop with ~16ms batching + command history capture
    async fn output_reader_loop(
        tab_id: String,
        mut rx: mpsc::UnboundedReceiver<Vec<u8>>,
        app_handle: AppHandle,
        db: Arc<Database>,
        initial_cwd: String,
    ) {
        let mut batch = Vec::with_capacity(16384);
        let batch_interval = tokio::time::Duration::from_millis(16);

        // Estado para captura de comandos
        let mut current_cwd = initial_cwd;
        let mut pending_command: Option<String> = None;
        let mut command_start: Option<std::time::Instant> = None;

        loop {
            match rx.recv().await {
                Some(data) => batch.extend_from_slice(&data),
                None => break,
            }

            while let Ok(data) = rx.try_recv() {
                batch.extend_from_slice(&data);
            }

            // OSC 633;E — comando capturado
            if let Some(cmd) = cwd_tracker::extract_osc633_command(&batch) {
                pending_command = Some(cmd);
            }

            // OSC 633;C — comando iniciou execucao
            if cwd_tracker::has_osc633_command_start(&batch) {
                command_start = Some(std::time::Instant::now());
            }

            // OSC 633;D — comando terminou
            if let Some(exit_code) = cwd_tracker::extract_osc633_exit_code(&batch) {
                if let Some(command) = pending_command.take() {
                    let duration_ms = command_start.take()
                        .map(|s| s.elapsed().as_millis() as i64);

                    let block = Block {
                        id: uuid::Uuid::now_v7().to_string(),
                        tab_id: tab_id.clone(),
                        command,
                        output: None,
                        output_purged: false,
                        exit_code: Some(exit_code),
                        cwd: Some(current_cwd.clone()),
                        git_branch: None,
                        git_dirty: false,
                        duration_ms,
                        line_count: None,
                        pinned: false,
                        created_at: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_secs() as i64,
                    };

                    let db_ref = db.clone();
                    tokio::spawn(async move {
                        if let Err(e) = db_ref.insert_block(&block).await {
                            eprintln!("[History] Failed to insert block: {}", e);
                        }
                    });
                }
            }

            // OSC 7 — CWD tracking
            if let Some(cwd) = cwd_tracker::extract_osc7_cwd(&batch) {
                current_cwd = cwd.clone();
                let _ = app_handle.emit("cwd_changed", CwdChangedEvent {
                    tab_id: tab_id.clone(),
                    cwd,
                });
            }

            let _ = app_handle.emit("pty_output", PtyOutputEvent {
                tab_id: tab_id.clone(),
                data: batch.clone(),
            });

            batch.clear();
            tokio::time::sleep(batch_interval).await;
        }
    }

    /// Writes to a tab's PTY
    pub fn write(&mut self, tab_id: &str, data: &[u8]) -> Result<(), String> {
        eprintln!("[PTY] write tab_id={} data_len={}", tab_id, data.len());
        // Mark as active on input
        if let Some(meta) = self.tab_meta.get_mut(tab_id) {
            meta.last_active = std::time::Instant::now();
            if meta.state != TabLifecycleState::Active {
                meta.state = TabLifecycleState::Active;
            }
        }

        let session = self.sessions.get_mut(tab_id)
            .ok_or_else(|| format!("Session {} not found", tab_id))?;
        session.write(data)
    }

    /// Resizes the PTY
    pub fn resize(&self, tab_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let session = self.sessions.get(tab_id)
            .ok_or_else(|| format!("Session {} not found", tab_id))?;
        session.resize(cols, rows)
    }

    /// Removes a session
    pub fn close_session(&mut self, tab_id: &str) {
        self.sessions.remove(tab_id);
        self.tab_meta.remove(tab_id);
    }

    /// Returns list of active session IDs
    pub fn active_sessions(&self) -> Vec<String> {
        self.sessions.keys().cloned().collect()
    }

    /// Hibernates a tab (frontend unmounts React, PTY continues)
    pub fn hibernate_tab(&mut self, tab_id: &str) -> Result<(), String> {
        let meta = self.tab_meta.get_mut(tab_id)
            .ok_or_else(|| format!("Tab {} not found", tab_id))?;
        meta.state = TabLifecycleState::Hibernated;
        Ok(())
    }

    /// Suspends a tab (SIGSTOP on process, minimal resources)
    pub fn suspend_tab(&mut self, tab_id: &str) -> Result<(), String> {
        let meta = self.tab_meta.get_mut(tab_id)
            .ok_or_else(|| format!("Tab {} not found", tab_id))?;
        meta.state = TabLifecycleState::Suspended;
        Ok(())
    }

    /// Restores a tab (SIGCONT + drains ring buffer)
    pub fn restore_tab(&mut self, tab_id: &str) -> Result<Vec<String>, String> {
        let meta = self.tab_meta.get_mut(tab_id)
            .ok_or_else(|| format!("Tab {} not found", tab_id))?;
        meta.state = TabLifecycleState::Active;
        meta.last_active = std::time::Instant::now();
        let buffered = meta.ring_buffer.drain_all();
        Ok(buffered)
    }

    /// Returns the tab's lifecycle state
    pub fn get_tab_state(&self, tab_id: &str) -> Option<&TabLifecycleState> {
        self.tab_meta.get(tab_id).map(|m| &m.state)
    }

    /// Checks tabs that should be hibernated/suspended
    pub fn check_lifecycle(&mut self, hibernate_after_s: u64, suspend_after_s: u64) -> Vec<(String, String)> {
        let now = std::time::Instant::now();
        let mut changes = Vec::new();

        for (tab_id, meta) in self.tab_meta.iter_mut() {
            let elapsed = now.duration_since(meta.last_active).as_secs();

            match meta.state {
                TabLifecycleState::Active if elapsed >= hibernate_after_s => {
                    meta.state = TabLifecycleState::Hibernated;
                    changes.push((tab_id.clone(), "hibernated".to_string()));
                }
                TabLifecycleState::Hibernated if elapsed >= suspend_after_s => {
                    meta.state = TabLifecycleState::Suspended;
                    changes.push((tab_id.clone(), "suspended".to_string()));
                }
                _ => {}
            }
        }

        changes
    }
}
