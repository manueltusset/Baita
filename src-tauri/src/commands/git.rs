use git2::{Repository, StatusOptions, DiffOptions, DiffFormat};
use serde::Serialize;

#[derive(Serialize)]
pub struct GitStatusInfo {
    pub branch: String,
    pub is_dirty: bool,
    pub staged: Vec<GitFileChange>,
    pub unstaged: Vec<GitFileChange>,
    pub untracked: Vec<String>,
}

#[derive(Serialize)]
pub struct GitFileChange {
    pub path: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct FileDiffResult {
    pub path: String,
    pub content: String,
}

#[tauri::command]
pub fn git_status(path: String) -> Result<GitStatusInfo, String> {
    let repo = Repository::discover(&path).map_err(|e| e.to_string())?;

    // Current branch
    let branch = repo.head()
        .ok()
        .and_then(|h| h.shorthand().map(String::from))
        .unwrap_or_else(|| "HEAD".to_string());

    let mut opts = StatusOptions::new();
    opts.include_untracked(true).recurse_untracked_dirs(true);
    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| e.to_string())?;

    let mut staged = Vec::new();
    let mut unstaged = Vec::new();
    let mut untracked = Vec::new();

    for entry in statuses.iter() {
        let path = entry.path().unwrap_or("").to_string();
        let s = entry.status();

        if s.is_index_new() || s.is_index_modified() || s.is_index_deleted() || s.is_index_renamed() {
            let status = if s.is_index_new() { "added" }
                else if s.is_index_modified() { "modified" }
                else if s.is_index_deleted() { "deleted" }
                else { "renamed" };
            staged.push(GitFileChange { path: path.clone(), status: status.to_string() });
        }

        if s.is_wt_modified() || s.is_wt_deleted() || s.is_wt_renamed() {
            let status = if s.is_wt_modified() { "modified" }
                else if s.is_wt_deleted() { "deleted" }
                else { "renamed" };
            unstaged.push(GitFileChange { path: path.clone(), status: status.to_string() });
        }

        if s.is_wt_new() {
            untracked.push(path);
        }
    }

    let is_dirty = !staged.is_empty() || !unstaged.is_empty() || !untracked.is_empty();

    Ok(GitStatusInfo {
        branch,
        is_dirty,
        staged,
        unstaged,
        untracked,
    })
}

#[tauri::command]
pub fn git_diff(path: String) -> Result<String, String> {
    let repo = Repository::discover(&path).map_err(|e| e.to_string())?;
    let mut opts = DiffOptions::new();
    let diff = repo.diff_index_to_workdir(None, Some(&mut opts))
        .map_err(|e| e.to_string())?;

    let mut output = String::new();
    diff.print(DiffFormat::Patch, |_delta, _hunk, line| {
        let prefix = match line.origin() {
            '+' => "+",
            '-' => "-",
            ' ' => " ",
            _ => "",
        };
        output.push_str(prefix);
        output.push_str(&String::from_utf8_lossy(line.content()));
        true
    }).map_err(|e| e.to_string())?;

    Ok(output)
}

#[tauri::command]
pub fn git_diff_file(path: String, file_path: String) -> Result<FileDiffResult, String> {
    let repo = Repository::discover(&path).map_err(|e| e.to_string())?;
    let mut opts = DiffOptions::new();
    opts.pathspec(&file_path);

    let diff = repo.diff_index_to_workdir(None, Some(&mut opts))
        .map_err(|e| e.to_string())?;

    let mut output = String::new();
    diff.print(DiffFormat::Patch, |_delta, _hunk, line| {
        let prefix = match line.origin() {
            '+' => "+",
            '-' => "-",
            ' ' => " ",
            _ => "",
        };
        output.push_str(prefix);
        output.push_str(&String::from_utf8_lossy(line.content()));
        true
    }).map_err(|e| e.to_string())?;

    // Se diff vazio, pode ser arquivo untracked — mostrar conteudo completo
    if output.is_empty() {
        let repo_path = repo.workdir().unwrap_or(std::path::Path::new(&path));
        let full = repo_path.join(&file_path);
        if full.exists() {
            if let Ok(content) = std::fs::read_to_string(&full) {
                let line_count = content.lines().count();
                let mut fake_diff = format!("@@ -0,0 +1,{} @@\n", line_count);
                for line in content.lines() {
                    fake_diff.push('+');
                    fake_diff.push_str(line);
                    fake_diff.push('\n');
                }
                return Ok(FileDiffResult { path: file_path, content: fake_diff });
            }
        }
    }

    Ok(FileDiffResult {
        path: file_path,
        content: output,
    })
}
