use crate::server::{app_config, types::{ErrorResponse, LogPayload, Perform, Permission}, window_info};

use std::collections::{HashMap, HashSet};

use tauri::Emitter;
use actix_web::{post, HttpRequest, HttpResponse, Responder, web};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
enum Method {
	Get,
	Post,
	Delete,
	Patch,
}

#[derive(Deserialize)]
struct Body {
	pub api: String,
	pub version: u8,
	pub endpoint: String,
	pub method: Method,
	pub body: Option<String>,
}

#[derive(Serialize)]
struct Response {
	pub status: u16,
	pub headers: HashMap<String, String>,
	pub body: Vec<u8>,
}

#[post("/perform/legacyApi")]
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
	
	if let Err(response) = app_config.plugin_has_permission(&plugin_id, &Permission::Copy) {
		return response;
	}
	
	let url = format!("https://{}.roblox.com/v{}/{}", body.api, body.version, body.endpoint);
	
	let method = match body.method {
		Method::Get => reqwest::Method::GET,
		Method::Post => reqwest::Method::POST,
		Method::Delete => reqwest::Method::DELETE,
		Method::Patch => reqwest::Method::PATCH,
	};
	
	let mut request = client.request(method, &url);
	
	if let Some(ref b) = body.body {
		if body.method != Method::Get {
			request = request.body(b.clone());
		} else {
			return HttpResponse::BadRequest().json(ErrorResponse { error: "cannot set body for get request".into() });
		}
	}
	
	let response = match request.send().await {
		Ok(response) => response,
		Err(e) => return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to send request: {e}") }),
	};
	
	let status = response.status().as_u16();
	
	let allowed_headers = HashSet::from(["content-type", "content-length", "date"]);
	let mut headers = HashMap::new();
	for (key, value) in response.headers().iter() {
		let key_str = key.as_str();
		let value_str = match value.to_str() {
			Ok(s) => s.to_string(),
			Err(e) => format!("failed to get header: {e}"),
		};
		
		if allowed_headers.contains(key_str) {
			headers.insert(key_str.to_string(), value_str);
		}
	}
	
	let body = match response.bytes().await {
		Ok(b) => b.to_vec(),
		Err(e) => return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to read body as bytes: {e}") }),
	};
	
	if let Err(e) = handle.emit("log", LogPayload { plugin_id: plugin_id.into(), performed: Perform::LegacyApi, data: url }) {
		return HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to log: {e}") });
	}
	
	HttpResponse::Ok().json(Response {
		status,
		body,
		headers,
	})
}
