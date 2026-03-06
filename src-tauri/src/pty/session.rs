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

        cmd.env("TERM", "xterm-256color");
        cmd.env("COLORTERM", "truecolor");
        cmd.env("TERM_PROGRAM", "Apple_Terminal");

        // Shell integration: OSC 633 (historico) + OSC 7 (CWD tracking)
        Self::setup_shell_integration(&mut cmd, shell);

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

    /// Injects shell integration hooks (OSC 633 + OSC 7)
    fn setup_shell_integration(cmd: &mut CommandBuilder, shell: &str) {
        let init_script = include_str!("../../shell-integration/init.sh");

        if shell.contains("zsh") {
            let tmp = std::env::temp_dir().join("baita-zsh");
            std::fs::create_dir_all(&tmp).ok();

            let original_zdotdir = std::env::var("ZDOTDIR")
                .unwrap_or_else(|_| {
                    dirs::home_dir()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|| "/".to_string())
                });

            let zshenv = format!(
                "export ZDOTDIR=\"{}\"\n[[ -f \"$ZDOTDIR/.zshenv\" ]] && source \"$ZDOTDIR/.zshenv\"\n{}",
                original_zdotdir, init_script
            );
            std::fs::write(tmp.join(".zshenv"), zshenv).ok();
            cmd.env("ZDOTDIR", tmp.to_string_lossy().to_string());
        } else if shell.contains("bash") {
            // --rcfile substitui -l (bash -l ignora --rcfile)
            // O rcfile sourca profile + bashrc + hooks
            let tmp = std::env::temp_dir().join("baita-bash-init.sh");
            let rcfile = format!(
                "[[ -f ~/.bash_profile ]] && source ~/.bash_profile\n[[ -f ~/.bashrc ]] && source ~/.bashrc\n{}",
                init_script
            );
            std::fs::write(&tmp, rcfile).ok();
            cmd.arg("--rcfile");
            cmd.arg(tmp.to_string_lossy().to_string());
        }
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
