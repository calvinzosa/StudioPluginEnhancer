use crate::server::types::{AppConfig, ErrorResponse};

use std::fs;
use tauri::Manager;

use actix_web::{HttpRequest, HttpResponse};

pub fn load_app_config(tauri_app: &tauri::AppHandle) -> Result<AppConfig, HttpResponse> {
	let config_path = match tauri_app.path().app_config_dir() {
		Ok(path) => path.join("Config.json"),
		Err(e) => return Err(HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to get config path: {e}") })),
	};
	
	let raw = fs::read_to_string(&config_path)
		.map_err(|e| HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to read config: {e}") }))?;
	
	serde_json::from_str(&raw)
		.map_err(|e| HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to parse config: {e}") }))
}

fn get_header<'req>(req: &'req HttpRequest, name: &str) -> Option<&'req str> {
	req.headers().get(name)?.to_str().ok()
}

pub fn get_plugin_id(req: &HttpRequest) -> Result<&str, HttpResponse> {
	match get_header(req, "SPE-Plugin-ID") {
		Some(plugin_id) => Ok(plugin_id),
		None => Err(HttpResponse::BadRequest().json(ErrorResponse { error: "SPE-Plugin-ID not found in request headers".into() })),
	}
}
