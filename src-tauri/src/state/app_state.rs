use crate::pty::manager::PtyManager;
use crate::storage::database::Database;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Global application state shared across Tauri commands
pub struct AppState {
    pub pty_manager: Arc<Mutex<PtyManager>>,
    pub db: Arc<Database>,
}

impl AppState {
    pub async fn new(app_data_dir: std::path::PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let db = Database::new(&app_data_dir).await?;
        let db = Arc::new(db);

        let pty_manager = PtyManager::new();
        let pty_manager = Arc::new(Mutex::new(pty_manager));

        Ok(Self { pty_manager, db })
    }
}
