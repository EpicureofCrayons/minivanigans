// Backup I/O to a user-chosen path. Done in Rust so it isn't constrained by the
// frontend fs capability scope (which is intentionally limited to the app-data dir).
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

// WKWebView does not reliably respond to JavaScript's window.print(). Tauri's
// native webview print method opens the macOS system dialog, including its
// built-in "Save as PDF" option.
#[tauri::command]
fn print_webview(window: tauri::WebviewWindow) -> Result<(), String> {
    #[cfg(desktop)]
    {
        window.print().map_err(|e| e.to_string())
    }

    #[cfg(not(desktop))]
    {
        let _ = window;
        Err("Native printing is unavailable on this platform.".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            write_text_file,
            write_binary_file,
            print_webview
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
