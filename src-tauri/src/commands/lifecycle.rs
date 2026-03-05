use crate::state::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn tab_hibernate(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
) -> Result<(), String> {
    let mut manager = state.pty_manager.lock().await;
    manager.hibernate_tab(&tab_id)
}

#[tauri::command]
pub async fn tab_suspend(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
) -> Result<(), String> {
    let mut manager = state.pty_manager.lock().await;
    manager.suspend_tab(&tab_id)
}

#[tauri::command]
pub async fn tab_restore(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
) -> Result<Vec<String>, String> {
    let mut manager = state.pty_manager.lock().await;
    manager.restore_tab(&tab_id)
}

#[tauri::command]
pub async fn tab_get_state(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
) -> Result<String, String> {
    let manager = state.pty_manager.lock().await;
    match manager.get_tab_state(&tab_id) {
        Some(s) => {
            let name = match s {
                crate::pty::manager::TabLifecycleState::Active => "active",
                crate::pty::manager::TabLifecycleState::Hibernated => "hibernated",
                crate::pty::manager::TabLifecycleState::Suspended => "suspended",
            };
            Ok(name.to_string())
        }
        None => Err(format!("Tab {} nao encontrada", tab_id)),
    }
}
