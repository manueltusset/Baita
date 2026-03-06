use crate::state::AppState;
use crate::storage::models::BlockMeta;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_blocks(
    state: State<'_, Arc<AppState>>,
    tab_id: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<Vec<BlockMeta>, String> {
    match tab_id {
        Some(id) => state.db.get_blocks(&id, limit, offset).await.map_err(|e| e.to_string()),
        None => state.db.get_all_blocks(limit, offset).await.map_err(|e| e.to_string()),
    }
}

#[tauri::command]
pub async fn search_blocks(
    state: State<'_, Arc<AppState>>,
    query: String,
    limit: i64,
) -> Result<Vec<BlockMeta>, String> {
    state.db.search_blocks(&query, limit).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pin_block(
    state: State<'_, Arc<AppState>>,
    block_id: String,
    pinned: bool,
) -> Result<(), String> {
    state.db.pin_block(&block_id, pinned).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_block_output(
    state: State<'_, Arc<AppState>>,
    block_id: String,
) -> Result<Option<String>, String> {
    let data = state.db.get_block_output(&block_id).await.map_err(|e| e.to_string())?;
    match data {
        None => Ok(None),
        Some(bytes) => Ok(Some(String::from_utf8_lossy(&bytes).to_string())),
    }
}
