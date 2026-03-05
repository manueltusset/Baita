use crate::pty::session::PtySession;
use crate::pty::cwd_tracker;
use std::collections::{HashMap, VecDeque};
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

        // Task to read output and emit events (with 16ms batching)
        let handle = app_handle.clone();
        let tid = tab_id.clone();
        tokio::spawn(async move {
            Self::output_reader_loop(tid, output_rx, handle).await;
        });

        Ok(())
    }

    /// Output reader loop with ~16ms batching
    async fn output_reader_loop(
        tab_id: String,
        mut rx: mpsc::UnboundedReceiver<Vec<u8>>,
        app_handle: AppHandle,
    ) {
        let mut batch = Vec::with_capacity(16384);
        let batch_interval = tokio::time::Duration::from_millis(16);

        loop {
            match rx.recv().await {
                Some(data) => batch.extend_from_slice(&data),
                None => break,
            }

            // Drain all available data
            while let Ok(data) = rx.try_recv() {
                batch.extend_from_slice(&data);
            }

            // Check OSC 7 for CWD
            if let Some(cwd) = cwd_tracker::extract_osc7_cwd(&batch) {
                let _ = app_handle.emit("cwd_changed", CwdChangedEvent {
                    tab_id: tab_id.clone(),
                    cwd,
                });
            }

            // Emit batch
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
