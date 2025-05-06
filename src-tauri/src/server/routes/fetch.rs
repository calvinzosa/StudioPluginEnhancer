use crate::server::{window_info, app_config, types::{ErrorResponse, Permission}, fetch};

use tauri_plugin_http::reqwest;

use actix_web::{post, web, HttpRequest, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct Body {
	pub init: fetch::FetchRequest,
}

#[derive(Serialize)]
struct Response {
	pub status: u16,
	pub body: Vec<u8>,
	pub headers: Vec<(String, String)>,
}

#[post("/perform/fetch")]
pub async fn route(req: HttpRequest, body: web::Json<Body>, handle: web::Data<tauri::AppHandle>, client: web::Data<reqwest::Client>) -> impl Responder {
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
	
	if let Err(response) = app_config.plugin_has_permission(&plugin_id, &Permission::Proxy) {
		return response;
	}
	
	match fetch::fetch(client, &body.init).await {
		Ok(response) => {
			let status = response.status().as_u16();
			
			let headers: Vec<(String, String)> = response.headers()
				.iter()
				.map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("<invalid utf-8>").to_string()))
				.collect();
			
			let body = match &response.bytes().await {
				Ok(bytes) => bytes.to_vec(),
				Err(_) => return HttpResponse::InternalServerError().json(ErrorResponse { error: "failed to read body as bytes".into() }),
			};
			
			HttpResponse::Ok().json(Response { status, body, headers })
		},
		Err(response) => response,
	}
}
