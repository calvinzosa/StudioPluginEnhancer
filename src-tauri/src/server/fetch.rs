use tauri_plugin_http::reqwest::{self, header::{HeaderName, HeaderValue}};
use std::collections::HashMap;
use actix_web::{web, HttpResponse};
use serde::Deserialize;

use super::types::ErrorResponse;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Method {
	Get,
	Post,
	Put,
	Delete,
	Patch,
	Head,
	Options,
}

#[derive(Debug, Deserialize)]
pub struct FetchRequest {
	pub url: String,
	#[serde(default = "default_method")]
	pub method: Method,
	#[serde(default)]
	pub headers: Option<HashMap<String, String>>,
	#[serde(default)]
	pub body: Option<String>,
}

fn default_method() -> Method {
	Method::Get
}

pub async fn fetch(client: web::Data<reqwest::Client>, init: &FetchRequest) -> Result<reqwest::Response, HttpResponse> {
	let method = match init.method {
		Method::Get => reqwest::Method::GET,
		Method::Post => reqwest::Method::POST,
		Method::Put => reqwest::Method::PUT,
		Method::Delete => reqwest::Method::DELETE,
		Method::Patch => reqwest::Method::PATCH,
		Method::Head => reqwest::Method::HEAD,
		Method::Options => reqwest::Method::OPTIONS,
	};
	
	let mut request = client.request(method, &init.url);
	
	if let Some(headers) = &init.headers {
		for (k, v) in headers {
			let header_name = match HeaderName::from_bytes(k.as_bytes()) {
				Ok(name) => name,
				Err(e) => return Err(HttpResponse::BadRequest().json(ErrorResponse { error: format!("invalid header name: {e}") })),
			};
			
			let header_value = match HeaderValue::from_str(v) {
				Ok(value) => value,
				Err(e) => return Err(HttpResponse::BadRequest().json(ErrorResponse { error: format!("invalid header value: {e}") })),
			};
			
			request = request.header(header_name, header_value);
		}
	}
	
	if let Some(body) = &init.body {
		request = request.body(body.clone());
	}
	
	request.send().await
		.map_err(|e| HttpResponse::InternalServerError().json(ErrorResponse { error: format!("error while fetching: {e}") }))
}
