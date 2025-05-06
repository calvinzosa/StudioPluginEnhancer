use crate::server::{window_info, app_config, types::{ErrorResponse, Permission}};

use std::{env::temp_dir, fs::File, io::Write};
use tauri::Emitter;

use actix_web::{post, HttpRequest, HttpResponse, Responder, web};
use serde::{Deserialize, Serialize};
use bytes::Bytes;
use uuid::Uuid;

#[derive(Serialize)]
#[serde(rename_all = "lowercase")]
enum DownloadStatus {
	Prompted,
}

#[derive(Deserialize)]
struct Query {
	pub name: String,
}

#[derive(Serialize)]
struct Response {
	pub name: String,
	pub status: DownloadStatus,
}

#[derive(Serialize, Clone)]
struct Payload {
	#[serde(rename = "tempPath")]
	pub temp_path: String,
	pub name: String,
	#[serde(rename = "pluginId")]
	pub plugin_id: String,
	pub size: usize,
}

#[post("/perform/download")]
pub async fn route(req: HttpRequest, body: Bytes, query: web::Query<Query>, handle: web::Data<tauri::AppHandle>) -> impl Responder {
	let plugin_id = match app_config::get_plugin_id(&req) {
		Ok(id) => id,
		Err(response) => return response,
	};
	
	if let Err(response) = window_info::ensure_roblox_studio_focused() {
		return response;
	}
	
	let app_config = match app_config::load_app_config(&handle) {
		Ok(c) => c,
		Err(response) => return response,
	};
	
	if let Err(response) = app_config.plugin_has_permission(&plugin_id, &Permission::Download) {
		return response;
	}
	
	let file_name = &query.name;
	let id = Uuid::new_v4();
	let temp_path = temp_dir().join(format!("SPE_TempFile_{plugin_id}_{id}.tmp"));
	
	let mut file = match File::create(&temp_path) {
		Ok(f) => f,
		Err(e) => return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to create temp file: {e}") }),
	};
	
	if let Err(e) = file.write_all(&body) {
		return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to write to temp file: {e}") });
	}
	
	let temp_path_str = match temp_path.to_str() {
		Some(path) => path.to_string(),
		None => return HttpResponse::InternalServerError().json(ErrorResponse { error: "failed to convert temp path into string".into() }),
	};
	
	let payload = Payload {
		temp_path: temp_path_str,
		name: file_name.to_string(),
		plugin_id: plugin_id.to_string(),
		size: body.len(),
	};
	
	if let Err(e) = handle.emit("initialize_download", payload) {
		return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to initialize authorization: {e}") });
	}
	
	HttpResponse::Ok().json(Response {
		name: file_name.to_string(),
		status: DownloadStatus::Prompted,
	})
}
