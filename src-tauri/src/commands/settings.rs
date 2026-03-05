use crate::state::AppState;
use crate::storage::models::{RetentionConfig, DbStats};
use serde::Serialize;
use std::sync::Arc;
use tauri::State;

#[derive(Serialize)]
pub struct CleanupReport {
    pub purged: i64,
    pub deleted: i64,
}

#[tauri::command]
pub async fn get_retention_config(
    state: State<'_, Arc<AppState>>,
) -> Result<RetentionConfig, String> {
    state.db.get_retention_config().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_retention_config(
    state: State<'_, Arc<AppState>>,
    config: RetentionConfig,
) -> Result<(), String> {
    state.db.set_retention_config(&config).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_db_stats(
    state: State<'_, Arc<AppState>>,
) -> Result<DbStats, String> {
    state.db.get_db_stats().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn run_cleanup_now(
    state: State<'_, Arc<AppState>>,
) -> Result<CleanupReport, String> {
    let config = state.db.get_retention_config().await.map_err(|e| e.to_string())?;
    let (purged, deleted) = state.db.run_cleanup(&config).await.map_err(|e| e.to_string())?;
    Ok(CleanupReport { purged, deleted })
}
