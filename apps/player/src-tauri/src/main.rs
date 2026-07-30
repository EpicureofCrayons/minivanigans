// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // WebKitGTK's DMABUF renderer fails on many Linux GPU/driver setups
    // (and inside the AppImage sandbox), producing
    // "Could not create default EGL display: EGL_BAD_PARAMETER" and a blank
    // window. Disabling it falls back to a renderer that works everywhere.
    // Must be set before the webview initializes, so do it here in main().
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    // On Fedora, disabling DMABUF alone isn't enough: WebKit still tries to
    // create an EGL display for accelerated compositing and aborts with the
    // same EGL_BAD_PARAMETER. Turning off compositing entirely avoids EGL.
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");

    player_lib::run()
}
