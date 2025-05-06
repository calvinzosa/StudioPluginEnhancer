use crate::server::app_config;

use actix_web::{get, HttpRequest, HttpResponse, Responder, web};
use serde::Serialize;

#[derive(Serialize)]
struct Response {
	pub id: String,
	pub authorized: bool,
}

#[get("/plugins/isAuthorized")]
async fn route(req: HttpRequest, handle: web::Data<tauri::AppHandle>) -> impl Responder {
	let plugin_id = match app_config::get_plugin_id(&req) {
		Ok(id) => id,
		Err(response) => return response,
	};
	
	let app_config = match app_config::load_app_config(&handle) {
		Ok(c) => c,
		Err(response) => return response,
	};
	
	HttpResponse::Ok().json(Response {
		id: plugin_id.to_string(),
		authorized: app_config.is_plugin_allowed(&plugin_id),
	})
}
