mod commands;
mod pty;
mod storage;
mod state;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Inicializacao sincrona: garante que AppState esta disponivel
            // antes do frontend fazer qualquer invoke
            let data_dir = app_handle.path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            eprintln!("[SETUP] Starting AppState init (block_on)...");
            let app_state = tauri::async_runtime::block_on(async {
                AppState::new(data_dir).await
            }).map_err(|e| format!("Failed to initialize state: {}", e))?;
            eprintln!("[SETUP] AppState ready, calling manage()...");

            let app_state = std::sync::Arc::new(app_state);
            app_handle.manage(app_state.clone());
            eprintln!("[SETUP] manage() done. App ready for commands.");

            // Background tasks (nao bloqueiam startup)
            let lifecycle_state = app_state.clone();
            let lifecycle_handle = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                lifecycle_loop(lifecycle_state, lifecycle_handle).await;
            });

            let cleanup_state = app_state.clone();
            tauri::async_runtime::spawn(async move {
                cleanup_loop(cleanup_state).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // PTY
            commands::tab_create,
            commands::tab_close,
            commands::pty_write,
            commands::pty_resize,
            commands::pty_save_buffer,
            commands::pty_get_buffer,
            // Lifecycle
            commands::tab_hibernate,
            commands::tab_suspend,
            commands::tab_restore,
            commands::tab_get_state,
            // Filesystem
            commands::read_directory,
            commands::read_file,
            commands::write_file,
            // Git
            commands::git_status,
            commands::git_diff,
            commands::git_diff_file,
            // Settings
            commands::get_retention_config,
            commands::set_retention_config,
            commands::get_db_stats,
            commands::run_cleanup_now,
            // SSH
            commands::ssh_exec,
            commands::ssh_list_profiles,
            commands::ssh_save_profile,
            commands::ssh_delete_profile,
            // System metrics
            commands::get_system_metrics,
        ])
        .run(tauri::generate_context!())
        .expect("Failed to start Baita Terminal");
}

/// Checks tabs for hibernation/suspension every 30s
async fn lifecycle_loop(state: std::sync::Arc<AppState>, app_handle: tauri::AppHandle) {
    use tauri::Emitter;
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;

        let changes = {
            let mut manager = state.pty_manager.lock().await;
            manager.check_lifecycle(120, 1800) // 2min hibernate, 30min suspend
        };

        for (tab_id, new_state) in changes {
            let _ = app_handle.emit("tab_state", pty::manager::TabStateEvent {
                tab_id,
                state: new_state,
            });
        }
    }
}

/// Cleanup job: runs once per hour, checks if it's the configured hour
async fn cleanup_loop(state: std::sync::Arc<AppState>) {
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;

        let config = match state.db.get_retention_config().await {
            Ok(c) => c,
            Err(_) => continue,
        };

        let now_hour = {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            ((now % 86400) / 3600) as i64
        };

        if now_hour == config.cleanup_hour {
            match state.db.run_cleanup(&config).await {
                Ok((p, d)) => eprintln!("Cleanup: {} purged, {} deleted", p, d),
                Err(e) => eprintln!("Cleanup error: {}", e),
            }
        }
    }
}
