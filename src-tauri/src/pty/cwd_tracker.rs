/// Extracts CWD from OSC 7 escape sequence
/// Format: ESC ] 7 ; file://hostname/path ST
pub fn extract_osc7_cwd(data: &[u8]) -> Option<String> {
    let text = String::from_utf8_lossy(data);

    // Search for OSC 7 patterns
    for pattern in ["\x1b]7;", "\x07"] {
        if let Some(start) = text.find("\x1b]7;") {
            let rest = &text[start + 4..];
            // Ends with BEL (\x07) or ST (\x1b\\)
            let end = rest
                .find('\x07')
                .or_else(|| rest.find("\x1b\\"))
                .unwrap_or(rest.len());
            let uri = &rest[..end];

            // Extract path from file:// URI
            if let Some(path_start) = uri.find("file://") {
                let path_part = &uri[path_start + 7..];
                // Remove hostname (up to first /)
                if let Some(slash) = path_part.find('/') {
                    return Some(path_part[slash..].to_string());
                }
            }
            // Fallback: may be a direct path
            if uri.starts_with('/') {
                return Some(uri.to_string());
            }
            let _ = pattern; // suppress warning
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_osc7() {
        let data = b"\x1b]7;file://localhost/Users/manu/baita\x07";
        assert_eq!(
            extract_osc7_cwd(data),
            Some("/Users/manu/baita".to_string())
        );
    }
}
