use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::{Pool, Sqlite, Row};
use std::path::Path;
use std::str::FromStr;
use crate::storage::models::*;

pub struct Database {
    pub pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(data_dir: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        std::fs::create_dir_all(data_dir)?;
        let db_path = data_dir.join("baita.db");
        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

        let options = SqliteConnectOptions::from_str(&db_url)?
            .journal_mode(SqliteJournalMode::Wal)
            .synchronous(SqliteSynchronous::Normal)
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options)
            .await?;

        // Performance pragmas
        sqlx::query("PRAGMA cache_size = -32000").execute(&pool).await?;
        sqlx::query("PRAGMA temp_store = MEMORY").execute(&pool).await?;
        sqlx::query("PRAGMA mmap_size = 268435456").execute(&pool).await?;

        let db = Self { pool };
        db.run_migrations().await?;
        Ok(db)
    }

    async fn run_migrations(&self) -> Result<(), Box<dyn std::error::Error>> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS sessions (
                id          TEXT PRIMARY KEY,
                label       TEXT,
                created_at  INTEGER NOT NULL,
                closed_at   INTEGER
            )"
        ).execute(&self.pool).await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tabs (
                id           TEXT PRIMARY KEY,
                session_id   TEXT NOT NULL,
                label        TEXT NOT NULL,
                shell        TEXT DEFAULT 'zsh',
                cwd          TEXT,
                state        TEXT DEFAULT 'active',
                last_active  INTEGER,
                created_at   INTEGER NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )"
        ).execute(&self.pool).await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS blocks (
                id              TEXT PRIMARY KEY,
                tab_id          TEXT NOT NULL,
                command         TEXT NOT NULL,
                output          BLOB,
                output_purged   INTEGER DEFAULT 0,
                exit_code       INTEGER,
                cwd             TEXT,
                git_branch      TEXT,
                git_dirty       INTEGER DEFAULT 0,
                duration_ms     INTEGER,
                line_count      INTEGER,
                pinned          INTEGER DEFAULT 0,
                created_at      INTEGER NOT NULL
            )"
        ).execute(&self.pool).await?;

        // Migration: remove FK constraint de bancos criados antes
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS _blocks_migrated (v INTEGER)"
        ).execute(&self.pool).await?;
        let migrated = sqlx::query("SELECT v FROM _blocks_migrated LIMIT 1")
            .fetch_optional(&self.pool).await?;
        if migrated.is_none() {
            // Recria tabela sem FK
            sqlx::query("ALTER TABLE blocks RENAME TO blocks_old").execute(&self.pool).await.ok();
            sqlx::query(
                "CREATE TABLE IF NOT EXISTS blocks (
                    id              TEXT PRIMARY KEY,
                    tab_id          TEXT NOT NULL,
                    command         TEXT NOT NULL,
                    output          BLOB,
                    output_purged   INTEGER DEFAULT 0,
                    exit_code       INTEGER,
                    cwd             TEXT,
                    git_branch      TEXT,
                    git_dirty       INTEGER DEFAULT 0,
                    duration_ms     INTEGER,
                    line_count      INTEGER,
                    pinned          INTEGER DEFAULT 0,
                    created_at      INTEGER NOT NULL
                )"
            ).execute(&self.pool).await?;
            sqlx::query(
                "INSERT INTO blocks SELECT * FROM blocks_old"
            ).execute(&self.pool).await.ok();
            sqlx::query("DROP TABLE IF EXISTS blocks_old").execute(&self.pool).await.ok();
            sqlx::query("INSERT INTO _blocks_migrated VALUES (1)").execute(&self.pool).await?;
        }

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS pty_buffer (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                tab_id    TEXT NOT NULL,
                content   BLOB NOT NULL,
                ts        INTEGER NOT NULL
            )"
        ).execute(&self.pool).await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS retention_config (
                key        TEXT PRIMARY KEY,
                value      TEXT NOT NULL,
                updated_at INTEGER
            )"
        ).execute(&self.pool).await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS ssh_profiles (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                host        TEXT NOT NULL,
                port        INTEGER DEFAULT 22,
                username    TEXT NOT NULL,
                auth_method TEXT DEFAULT 'key',
                key_path    TEXT
            )"
        ).execute(&self.pool).await?;

        // Indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_blocks_tab_time ON blocks(tab_id, created_at DESC)")
            .execute(&self.pool).await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_blocks_pinned ON blocks(pinned) WHERE pinned = 1")
            .execute(&self.pool).await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pty_buffer_tab ON pty_buffer(tab_id, ts)")
            .execute(&self.pool).await?;

        // FTS5
        sqlx::query(
            "CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(
                command, cwd, git_branch,
                content = 'blocks', content_rowid = 'rowid'
            )"
        ).execute(&self.pool).await?;

        // FTS triggers
        sqlx::query(
            "CREATE TRIGGER IF NOT EXISTS blocks_fts_insert AFTER INSERT ON blocks BEGIN
                INSERT INTO blocks_fts(rowid, command, cwd, git_branch)
                VALUES (new.rowid, new.command, new.cwd, new.git_branch);
            END"
        ).execute(&self.pool).await?;

        sqlx::query(
            "CREATE TRIGGER IF NOT EXISTS blocks_fts_delete AFTER DELETE ON blocks BEGIN
                INSERT INTO blocks_fts(blocks_fts, rowid, command, cwd, git_branch)
                VALUES ('delete', old.rowid, old.command, old.cwd, old.git_branch);
            END"
        ).execute(&self.pool).await?;

        // Default retention values
        sqlx::query(
            "INSERT OR IGNORE INTO retention_config VALUES ('output_retention_days', '7', strftime('%s','now'))"
        ).execute(&self.pool).await?;
        sqlx::query(
            "INSERT OR IGNORE INTO retention_config VALUES ('command_retention_days', '90', strftime('%s','now'))"
        ).execute(&self.pool).await?;
        sqlx::query(
            "INSERT OR IGNORE INTO retention_config VALUES ('session_retention_days', '30', strftime('%s','now'))"
        ).execute(&self.pool).await?;
        sqlx::query(
            "INSERT OR IGNORE INTO retention_config VALUES ('max_db_size_mb', '500', strftime('%s','now'))"
        ).execute(&self.pool).await?;
        sqlx::query(
            "INSERT OR IGNORE INTO retention_config VALUES ('cleanup_hour', '3', strftime('%s','now'))"
        ).execute(&self.pool).await?;

        Ok(())
    }

    // -- Blocks --

    pub async fn insert_block(&self, block: &Block) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO blocks (id, tab_id, command, output, exit_code, cwd, git_branch, git_dirty, duration_ms, line_count, pinned, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&block.id)
        .bind(&block.tab_id)
        .bind(&block.command)
        .bind(&block.output)
        .bind(block.exit_code)
        .bind(&block.cwd)
        .bind(&block.git_branch)
        .bind(block.git_dirty as i32)
        .bind(block.duration_ms)
        .bind(block.line_count)
        .bind(block.pinned as i32)
        .bind(block.created_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_all_blocks(&self, limit: i64, offset: i64) -> Result<Vec<BlockMeta>, sqlx::Error> {
        let rows = sqlx::query(
            "SELECT id, tab_id, command, exit_code, cwd, git_branch, git_dirty, duration_ms, line_count, pinned, created_at
             FROM blocks ORDER BY created_at DESC LIMIT ? OFFSET ?"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let blocks = rows.iter().map(|r| BlockMeta {
            id: r.get("id"),
            tab_id: r.get("tab_id"),
            command: r.get("command"),
            exit_code: r.get("exit_code"),
            cwd: r.get("cwd"),
            git_branch: r.get("git_branch"),
            git_dirty: r.get::<i32, _>("git_dirty") != 0,
            duration_ms: r.get("duration_ms"),
            line_count: r.get("line_count"),
            pinned: r.get::<i32, _>("pinned") != 0,
            created_at: r.get("created_at"),
        }).collect();

        Ok(blocks)
    }

    pub async fn get_blocks(&self, tab_id: &str, limit: i64, offset: i64) -> Result<Vec<BlockMeta>, sqlx::Error> {
        let rows = sqlx::query(
            "SELECT id, tab_id, command, exit_code, cwd, git_branch, git_dirty, duration_ms, line_count, pinned, created_at
             FROM blocks WHERE tab_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        )
        .bind(tab_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let blocks = rows.iter().map(|r| BlockMeta {
            id: r.get("id"),
            tab_id: r.get("tab_id"),
            command: r.get("command"),
            exit_code: r.get("exit_code"),
            cwd: r.get("cwd"),
            git_branch: r.get("git_branch"),
            git_dirty: r.get::<i32, _>("git_dirty") != 0,
            duration_ms: r.get("duration_ms"),
            line_count: r.get("line_count"),
            pinned: r.get::<i32, _>("pinned") != 0,
            created_at: r.get("created_at"),
        }).collect();

        Ok(blocks)
    }

    pub async fn get_block_output(&self, block_id: &str) -> Result<Option<Vec<u8>>, sqlx::Error> {
        let row = sqlx::query("SELECT output FROM blocks WHERE id = ?")
            .bind(block_id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.and_then(|r| r.get("output")))
    }

    pub async fn pin_block(&self, block_id: &str, pinned: bool) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE blocks SET pinned = ? WHERE id = ?")
            .bind(pinned as i32)
            .bind(block_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn search_blocks(&self, query: &str, limit: i64) -> Result<Vec<BlockMeta>, sqlx::Error> {
        let rows = sqlx::query(
            "SELECT b.id, b.tab_id, b.command, b.exit_code, b.cwd, b.git_branch, b.git_dirty, b.duration_ms, b.line_count, b.pinned, b.created_at
             FROM blocks b
             JOIN blocks_fts f ON b.rowid = f.rowid
             WHERE blocks_fts MATCH ?
             ORDER BY b.created_at DESC LIMIT ?"
        )
        .bind(query)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        let blocks = rows.iter().map(|r| BlockMeta {
            id: r.get("id"),
            tab_id: r.get("tab_id"),
            command: r.get("command"),
            exit_code: r.get("exit_code"),
            cwd: r.get("cwd"),
            git_branch: r.get("git_branch"),
            git_dirty: r.get::<i32, _>("git_dirty") != 0,
            duration_ms: r.get("duration_ms"),
            line_count: r.get("line_count"),
            pinned: r.get::<i32, _>("pinned") != 0,
            created_at: r.get("created_at"),
        }).collect();

        Ok(blocks)
    }

    // -- Retention --

    pub async fn get_retention_config(&self) -> Result<RetentionConfig, sqlx::Error> {
        let rows = sqlx::query("SELECT key, value FROM retention_config")
            .fetch_all(&self.pool).await?;

        let mut config = RetentionConfig::default();
        for row in rows {
            let key: String = row.get("key");
            let val: String = row.get("value");
            match key.as_str() {
                "output_retention_days" => config.output_retention_days = val.parse().unwrap_or(7),
                "command_retention_days" => config.command_retention_days = val.parse().unwrap_or(90),
                "session_retention_days" => config.session_retention_days = val.parse().unwrap_or(30),
                "max_db_size_mb" => config.max_db_size_mb = val.parse().unwrap_or(500),
                "cleanup_hour" => config.cleanup_hour = val.parse().unwrap_or(3),
                _ => {}
            }
        }
        Ok(config)
    }

    pub async fn set_retention_config(&self, config: &RetentionConfig) -> Result<(), sqlx::Error> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as i64;

        let pairs = [
            ("output_retention_days", config.output_retention_days.to_string()),
            ("command_retention_days", config.command_retention_days.to_string()),
            ("session_retention_days", config.session_retention_days.to_string()),
            ("max_db_size_mb", config.max_db_size_mb.to_string()),
            ("cleanup_hour", config.cleanup_hour.to_string()),
        ];

        for (key, val) in &pairs {
            sqlx::query("INSERT OR REPLACE INTO retention_config (key, value, updated_at) VALUES (?, ?, ?)")
                .bind(key).bind(val).bind(now)
                .execute(&self.pool).await?;
        }
        Ok(())
    }

    pub async fn get_db_stats(&self) -> Result<DbStats, sqlx::Error> {
        let size_row = sqlx::query("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
            .fetch_one(&self.pool).await?;
        let size_bytes: i64 = size_row.get("size");

        let block_row = sqlx::query("SELECT COUNT(*) as cnt FROM blocks")
            .fetch_one(&self.pool).await?;
        let block_count: i64 = block_row.get("cnt");

        let session_row = sqlx::query("SELECT COUNT(*) as cnt FROM sessions")
            .fetch_one(&self.pool).await?;
        let session_count: i64 = session_row.get("cnt");

        Ok(DbStats {
            size_bytes,
            block_count,
            session_count,
            last_cleanup: None,
        })
    }

    // -- Cleanup --

    pub async fn run_cleanup(&self, config: &RetentionConfig) -> Result<(i64, i64), sqlx::Error> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as i64;

        // Purge expired output
        let output_cutoff = now - (config.output_retention_days * 86400);
        let purged = sqlx::query(
            "UPDATE blocks SET output = NULL, output_purged = 1
             WHERE created_at < ? AND output_purged = 0 AND pinned = 0"
        ).bind(output_cutoff).execute(&self.pool).await?.rows_affected() as i64;

        // Delete expired blocks
        let command_cutoff = now - (config.command_retention_days * 86400);
        let deleted = sqlx::query(
            "DELETE FROM blocks WHERE created_at < ? AND pinned = 0"
        ).bind(command_cutoff).execute(&self.pool).await?.rows_affected() as i64;

        // Delete expired sessions
        let session_cutoff = now - (config.session_retention_days * 86400);
        sqlx::query("DELETE FROM sessions WHERE created_at < ?")
            .bind(session_cutoff).execute(&self.pool).await?;

        // Enforce size limit
        let max_bytes = config.max_db_size_mb * 1_048_576;
        loop {
            let stats = self.get_db_stats().await?;
            if stats.size_bytes <= max_bytes { break; }
            let removed = sqlx::query(
                "DELETE FROM blocks WHERE id IN (
                    SELECT id FROM blocks WHERE pinned = 0 ORDER BY created_at ASC LIMIT 100
                )"
            ).execute(&self.pool).await?.rows_affected();
            if removed == 0 { break; }
        }

        // Vacuum
        sqlx::query("PRAGMA incremental_vacuum")
            .execute(&self.pool).await?;

        Ok((purged, deleted))
    }

    // -- PTY Buffer --

    pub async fn save_buffer(&self, tab_id: &str, data: &[u8]) -> Result<(), sqlx::Error> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as i64;

        // Remove buffer anterior do tab
        sqlx::query("DELETE FROM pty_buffer WHERE tab_id = ?")
            .bind(tab_id).execute(&self.pool).await?;

        sqlx::query("INSERT INTO pty_buffer (tab_id, content, ts) VALUES (?, ?, ?)")
            .bind(tab_id).bind(data).bind(now)
            .execute(&self.pool).await?;
        Ok(())
    }

    pub async fn get_buffer(&self, tab_id: &str) -> Result<Option<Vec<u8>>, sqlx::Error> {
        let row = sqlx::query("SELECT content FROM pty_buffer WHERE tab_id = ? ORDER BY ts DESC LIMIT 1")
            .bind(tab_id)
            .fetch_optional(&self.pool).await?;
        Ok(row.map(|r| r.get("content")))
    }

    // -- SSH Profiles --

    pub async fn get_ssh_profiles(&self) -> Result<Vec<SshProfile>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM ssh_profiles ORDER BY name")
            .fetch_all(&self.pool).await?;

        Ok(rows.iter().map(|r| SshProfile {
            id: r.get("id"),
            name: r.get("name"),
            host: r.get("host"),
            port: r.get("port"),
            username: r.get("username"),
            auth_method: r.get("auth_method"),
            key_path: r.get("key_path"),
        }).collect())
    }

    pub async fn save_ssh_profile(&self, profile: &SshProfile) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT OR REPLACE INTO ssh_profiles (id, name, host, port, username, auth_method, key_path)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&profile.id).bind(&profile.name).bind(&profile.host)
        .bind(profile.port).bind(&profile.username)
        .bind(&profile.auth_method).bind(&profile.key_path)
        .execute(&self.pool).await?;
        Ok(())
    }

    pub async fn delete_ssh_profile(&self, id: &str) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM ssh_profiles WHERE id = ?")
            .bind(id).execute(&self.pool).await?;
        Ok(())
    }
}
