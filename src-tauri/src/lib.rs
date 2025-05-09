mod server;

use std::{env, thread};
use tauri::{Emitter, Manager};

use serde::Serialize;

#[derive(Serialize, Clone)]
struct ShutdownPayload {
	error: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_clipboard_manager::init())
		.plugin(tauri_plugin_http::init())
		.plugin(tauri_plugin_shell::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_store::Builder::new().build())
		.plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec![])))
		.plugin(tauri_plugin_process::init())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_opener::init())
		.setup(|app| {
			let handle = app.handle().clone();
			let path = app.path().clone();
			
			thread::spawn(move || {
				let rt = actix_web::rt::System::new();
				rt.block_on(async move {
					if let Err(e) = server::init(handle.clone(), path).await {
						handle.emit("shutdown", ShutdownPayload {
							error: e.to_string(),
						}).unwrap();
					}
				});
			});
			
			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
