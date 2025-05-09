use crate::server::{window_info, app_config, types::{ErrorResponse, LogPayload, Permission, Perform}};

use tauri::Emitter;
use tauri_plugin_clipboard_manager::ClipboardExt;
use actix_web::{post, HttpRequest, HttpResponse, Responder, web};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
#[serde(rename_all = "lowercase")]
enum CopyStatus {
	Copied,
}

#[derive(Deserialize)]
struct Body {
	pub value: String,
}

#[derive(Serialize)]
struct Response {
	pub status: CopyStatus,
}

#[post("/perform/copy")]
pub async fn route(req: HttpRequest, body: web::Json<Body>, handle: web::Data<tauri::AppHandle>) -> impl Responder {
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
	
	if let Err(response) = app_config.plugin_has_permission(&plugin_id, &Permission::Copy) {
		return response;
	}
	
	if let Err(e) = handle.emit("log", LogPayload { plugin_id: plugin_id.into(), performed: Perform::Copy, data: body.value.clone() }) {
		return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to log: {e}") });
	}
	
	match handle.clipboard().write_text(&body.value) {
		Ok(()) => HttpResponse::Ok().json(Response { status: CopyStatus::Copied }),
		Err(e) => HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to copy text: {e}") }),
	}
}
