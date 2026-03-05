use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::io::{Read, Write};
use std::sync::Arc;
use tokio::sync::mpsc;

/// Individual PTY session managing a shell process
pub struct PtySession {
    pub id: String,
    pub shell: String,
    pub cwd: String,
    writer: Box<dyn Write + Send>,
    _master: Box<dyn MasterPty + Send>,
    pub output_tx: mpsc::UnboundedSender<Vec<u8>>,
    pub alive: Arc<std::sync::atomic::AtomicBool>,
}

impl PtySession {
    pub fn spawn(
        id: String,
        shell: &str,
        args: &[String],
        cwd: &str,
        cols: u16,
        rows: u16,
    ) -> Result<(Self, mpsc::UnboundedReceiver<Vec<u8>>), String> {
        let pty_system = native_pty_system();
        let size = PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        let pair = pty_system
            .openpty(size)
            .map_err(|e| format!("Failed to open PTY: {}", e))?;

        let mut cmd = CommandBuilder::new(shell);
        for arg in args {
            cmd.arg(arg);
        }
        cmd.cwd(cwd);

        // Environment variables to detect CWD via OSC 7
        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        // Ativa OSC 7 built-in do macOS zsh (/etc/zshrc)
        cmd.env("TERM_PROGRAM", "Apple_Terminal");

        // Bash nao tem hook automatico, injetar via PROMPT_COMMAND
        if shell.contains("bash") {
            cmd.env("PROMPT_COMMAND",
                r#"printf '\e]7;file://%s%s\a' "$(hostname)" "$PWD""#);
        }

        pair.slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {}", e))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("Failed to get writer: {}", e))?;

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to get reader: {}", e))?;

        let (output_tx, output_rx) = mpsc::unbounded_channel();
        let alive = Arc::new(std::sync::atomic::AtomicBool::new(true));
        let alive_clone = alive.clone();
        let tx_clone = output_tx.clone();

        // PTY reader thread
        std::thread::spawn(move || {
            let mut buf = [0u8; 8192];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        if tx_clone.send(buf[..n].to_vec()).is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
            alive_clone.store(false, std::sync::atomic::Ordering::Relaxed);
        });

        let session = PtySession {
            id,
            shell: shell.to_string(),
            cwd: cwd.to_string(),
            writer,
            _master: pair.master,
            output_tx,
            alive,
        };

        Ok((session, output_rx))
    }

    /// Writes data to the PTY (user input)
    pub fn write(&mut self, data: &[u8]) -> Result<(), String> {
        self.writer
            .write_all(data)
            .map_err(|e| format!("Failed to write to PTY: {}", e))?;
        self.writer
            .flush()
            .map_err(|e| format!("Failed to flush PTY: {}", e))?;
        Ok(())
    }

    /// Resizes the PTY
    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self._master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to resize PTY: {}", e))
    }

    pub fn is_alive(&self) -> bool {
        self.alive.load(std::sync::atomic::Ordering::Relaxed)
    }
}
