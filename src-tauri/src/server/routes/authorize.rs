use crate::server::{window_info, app_config, types::{ErrorResponse, Permission}};

use std::collections::HashSet;
use tauri::Emitter;

use actix_web::{post, HttpRequest, HttpResponse, Responder, web};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PluginStatus {
	Authorized,
	Blocked,
	Requested,
}

#[derive(Deserialize)]
struct Body {
	pub name: String,
	pub author: u64,
	#[serde(rename = "requestedPermissions")]
	pub requested_permissions: Vec<Permission>,
}

#[derive(Serialize)]
struct Response {
	pub status: PluginStatus,
}

#[derive(Serialize, Clone)]
struct Payload {
	pub id: String,
	pub name: String,
	pub author: String,
	#[serde(rename = "requestedPermissions")]
	pub requested_permissions: Vec<Permission>,
}

#[post("/plugins/authorize")]
pub async fn route(req: HttpRequest, body: web::Json<Body>, handle: web::Data<tauri::AppHandle>) -> impl Responder {
	let plugin_id = match app_config::get_plugin_id(&req) {
		Ok(id) => id,
		Err(response) => return response,
	};
	
	let app_config = match app_config::load_app_config(&handle) {
		Ok(c) => c,
		Err(response) => return response,
	};
	
	if app_config.is_plugin_allowed(&plugin_id) {
		return HttpResponse::Ok().json(Response {
			status: PluginStatus::Authorized,
		});
	}
	
	if app_config.is_plugin_blocked(&plugin_id) {
		return HttpResponse::Forbidden().json(Response {
			status: PluginStatus::Blocked,
		});
	}
	
	if let Err(response) = window_info::ensure_roblox_studio_focused() {
		return response;
	}
	
	if plugin_id.len() > 16 || !plugin_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
		return HttpResponse::BadRequest().json(ErrorResponse {
			error: "id must be at most 16 characters in length and only contain alphanumeric characters and hyphens (-)".into(),
		});
	}
	
	if body.name.len() > 32 {
		return HttpResponse::BadRequest().json(ErrorResponse {
			error: "name must be at most 32 characters in length".into(),
		});
	}
	
	let mut seen = HashSet::new();
	for perm in &body.requested_permissions {
		if !seen.insert(perm) {
			return HttpResponse::BadRequest().json(ErrorResponse { error: format!("duplicate permission: {perm:?}") });
		}
	}
	
	let payload = Payload {
		id: plugin_id.to_string(),
		name: body.name.to_string(),
		author: body.author.to_string(),
		requested_permissions: body.requested_permissions.clone(),
	};
	
	match handle.emit("plugin_authorize", payload) {
		Ok(_) => HttpResponse::Ok().json(Response { status: PluginStatus::Requested }),
		Err(e) => HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to initialize authorization: {e}") }),
	}
}
