use crate::state::AppState;
use serde::Serialize;
use std::sync::Arc;
use std::io::{Read, Write};
use tauri::State;

#[derive(Serialize)]
pub struct TabInfo {
    pub id: String,
    pub label: String,
    pub shell: String,
    pub cwd: String,
}

#[tauri::command]
pub async fn tab_create(
    state: State<'_, Arc<AppState>>,
    app_handle: tauri::AppHandle,
    cwd: Option<String>,
    shell: Option<String>,
    shell_args: Option<Vec<String>>,
) -> Result<TabInfo, String> {
    eprintln!("[PTY] tab_create called");
    let shell = shell.unwrap_or_else(|| "zsh".to_string());
    let cwd = cwd.unwrap_or_else(|| {
        dirs::home_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| "/".to_string())
    });
    let args: Vec<String> = shell_args.unwrap_or_default().iter().map(|a| {
        if a.starts_with("~/") {
            if let Some(home) = dirs::home_dir() {
                return format!("{}/{}", home.display(), &a[2..]);
            }
        }
        a.clone()
    }).collect();
    let tab_id = uuid::Uuid::now_v7().to_string();

    let mut manager = state.pty_manager.lock().await;
    manager.create_session(
        tab_id.clone(),
        &shell,
        &args,
        &cwd,
        120,
        30,
        app_handle,
    )?;

    eprintln!("[PTY] tab_create success, id={}", tab_id);
    Ok(TabInfo {
        id: tab_id,
        label: cwd.split('/').last().unwrap_or("shell").to_string(),
        shell,
        cwd,
    })
}

#[tauri::command]
pub async fn tab_close(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
) -> Result<(), String> {
    let mut manager = state.pty_manager.lock().await;
    manager.close_session(&tab_id);
    Ok(())
}

#[tauri::command]
pub async fn pty_write(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let mut manager = state.pty_manager.lock().await;
    manager.write(&tab_id, &data)
}

#[tauri::command]
pub async fn pty_resize(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let manager = state.pty_manager.lock().await;
    manager.resize(&tab_id, cols, rows)
}

#[tauri::command]
pub async fn pty_save_buffer(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
    data: String,
) -> Result<(), String> {
    // Comprime com zstd nível 3
    let mut encoder = zstd::Encoder::new(Vec::new(), 3).map_err(|e| e.to_string())?;
    encoder.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    let compressed = encoder.finish().map_err(|e| e.to_string())?;

    state.db.save_buffer(&tab_id, &compressed).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pty_get_buffer(
    state: State<'_, Arc<AppState>>,
    tab_id: String,
) -> Result<Option<String>, String> {
    let compressed = state.db.get_buffer(&tab_id).await.map_err(|e| e.to_string())?;
    match compressed {
        None => Ok(None),
        Some(data) => {
            let mut decoder = zstd::Decoder::new(data.as_slice()).map_err(|e| e.to_string())?;
            let mut decompressed = String::new();
            decoder.read_to_string(&mut decompressed).map_err(|e| e.to_string())?;
            Ok(Some(decompressed))
        }
    }
}
