mod window_info;
mod app_config;
mod types;
mod fetch;
mod routes;

use types::{ErrorResponse, AppConfig, Permission, AuthorizedPlugin};

use std::io;
use tauri::{path::PathResolver, AppHandle, Wry};
use tauri_plugin_http::reqwest::Client;

use actix_web::{web, App, HttpResponse, HttpServer};
use actix_governor::{Governor, GovernorConfigBuilder};

impl AppConfig {
	fn is_permission_enabled(&self, permission: &Permission) -> bool {
		match permission {
			Permission::Copy => self.app_config.plugins.copy,
			Permission::Download => self.app_config.plugins.download,
			Permission::Proxy => self.app_config.plugins.proxy,
		}
	}
	
	fn get_plugin(&self, plugin_id: &str) -> Option<&AuthorizedPlugin> {
		self.authorized_plugins.allowed_plugins.get(plugin_id)
	}
	
	fn is_plugin_allowed(&self, plugin_id: &str) -> bool {
		self.authorized_plugins.allowed_plugins.contains_key(plugin_id)
	}
	
	fn is_plugin_blocked(&self, plugin_id: &str) -> bool {
		self.authorized_plugins.blocked_plugins.contains(plugin_id)
	}
	
	fn plugin_has_permission(&self, plugin_id: &str, permission: &Permission) -> Result<(), HttpResponse> {
		let plugin = self.get_plugin(plugin_id).ok_or_else(|| HttpResponse::Forbidden().json(ErrorResponse { error: "unauthorized".into() }))?;
		
		if !self.is_permission_enabled(permission) || !plugin.allowed_permissions.contains(permission) {
			Err(HttpResponse::Forbidden().json(ErrorResponse { error: format!("missing permission: {:?}", permission) }))
		} else {
			Ok(())
		}
	}
}

pub async fn init(handle: AppHandle, path: PathResolver<Wry>) -> io::Result<()> {
	let governor_conf = GovernorConfigBuilder::default()
		.seconds_per_request(2)
		.burst_size(1)
		.finish()
		.expect("governor config builder failed");
	
	HttpServer::new(move || {
		App::new()
			.wrap(Governor::new(&governor_conf))
			.app_data(web::Data::new(handle.clone()))
			.app_data(web::Data::new(path.clone()))
			.app_data(Client::new())
			.service(routes::root::route)
			.service(routes::authorize::route)
			.service(routes::is_authorized::route)
			.service(routes::copy::route)
			.service(routes::download::route)
			.service(routes::fetch::route)
	})
	.bind(("127.0.0.1", 4892))?
	.run()
	.await
}
