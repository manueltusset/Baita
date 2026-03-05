use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub label: Option<String>,
    pub created_at: i64,
    pub closed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tab {
    pub id: String,
    pub session_id: String,
    pub label: String,
    pub shell: String,
    pub cwd: Option<String>,
    pub state: String,
    pub last_active: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub tab_id: String,
    pub command: String,
    pub output: Option<Vec<u8>>,
    pub output_purged: bool,
    pub exit_code: Option<i32>,
    pub cwd: Option<String>,
    pub git_branch: Option<String>,
    pub git_dirty: bool,
    pub duration_ms: Option<i64>,
    pub line_count: Option<i32>,
    pub pinned: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockMeta {
    pub id: String,
    pub tab_id: String,
    pub command: String,
    pub exit_code: Option<i32>,
    pub cwd: Option<String>,
    pub git_branch: Option<String>,
    pub git_dirty: bool,
    pub duration_ms: Option<i64>,
    pub line_count: Option<i32>,
    pub pinned: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionConfig {
    pub output_retention_days: i64,
    pub command_retention_days: i64,
    pub session_retention_days: i64,
    pub max_db_size_mb: i64,
    pub cleanup_hour: i64,
}

impl Default for RetentionConfig {
    fn default() -> Self {
        Self {
            output_retention_days: 7,
            command_retention_days: 90,
            session_retention_days: 30,
            max_db_size_mb: 500,
            cleanup_hour: 3,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbStats {
    pub size_bytes: i64,
    pub block_count: i64,
    pub session_count: i64,
    pub last_cleanup: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshProfile {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    pub auth_method: String,
    pub key_path: Option<String>,
}
