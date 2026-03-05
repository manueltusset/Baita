use crate::state::AppState;
use crate::storage::models::SshProfile;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn ssh_exec(
    host: String,
    port: u16,
    username: String,
    auth_method: String,
    key_path: Option<String>,
    command: String,
) -> Result<String, String> {
    let mut cmd = std::process::Command::new("ssh");
    cmd.arg("-o").arg("StrictHostKeyChecking=accept-new")
       .arg("-o").arg("BatchMode=yes")
       .arg("-o").arg("ConnectTimeout=5");

    if port != 22 {
        cmd.arg("-p").arg(port.to_string());
    }
    if auth_method == "key" {
        if let Some(kp) = &key_path {
            let resolved = if kp.starts_with("~/") {
                dirs::home_dir()
                    .map(|h| format!("{}/{}", h.display(), &kp[2..]))
                    .unwrap_or_else(|| kp.clone())
            } else {
                kp.clone()
            };
            cmd.arg("-i").arg(resolved);
        }
    }

    cmd.arg(format!("{}@{}", username, host));
    cmd.arg(&command);

    let output = cmd.output().map_err(|e| e.to_string())?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    // Retorna stdout mesmo com exit code != 0 (ex: git diff retorna 1 quando ha diferencas)
    // So falha quando nao ha stdout e o comando realmente falhou
    if stdout.is_empty() && !output.status.success() {
        return Err(format!("SSH command failed: {}", stderr));
    }
    Ok(stdout)
}

#[tauri::command]
pub async fn ssh_list_profiles(
    state: State<'_, Arc<AppState>>,
) -> Result<Vec<SshProfile>, String> {
    state.db.get_ssh_profiles().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ssh_save_profile(
    state: State<'_, Arc<AppState>>,
    profile: SshProfile,
) -> Result<(), String> {
    state.db.save_ssh_profile(&profile).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ssh_delete_profile(
    state: State<'_, Arc<AppState>>,
    id: String,
) -> Result<(), String> {
    state.db.delete_ssh_profile(&id).await.map_err(|e| e.to_string())
}
