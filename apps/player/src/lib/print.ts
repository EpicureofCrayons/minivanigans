import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Open the platform print dialog for the current screen.
 *
 * Browser builds use the normal web print API. The macOS Tauri webview needs
 * its native Rust print method instead; calling window.print() there may do
 * nothing even though the same page prints correctly in Safari or Chrome.
 */
export async function openPrintDialog(): Promise<void> {
  try {
    if (isTauri()) {
      await invoke("print_webview");
    } else {
      window.print();
    }
  } catch (error) {
    console.error("Could not open the print dialog.", error);
    window.alert(
      "Minivanigans could not open the system print dialog. Try restarting the app, then try again."
    );
  }
}
