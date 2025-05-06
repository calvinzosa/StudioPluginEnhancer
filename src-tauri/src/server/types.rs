use std::collections::{HashMap, HashSet};

use serde::{Deserialize, Serialize};

// app config
#[derive(Serialize, Deserialize, Debug, PartialEq, Eq, Hash, Clone)]
#[serde(rename_all = "lowercase")]
pub enum Permission {
	Copy,
	Download,
	Proxy,
}

#[derive(Deserialize)]
pub struct AppConfig {
	#[serde(rename = "AppSettings")]
	pub app_config: AppSettings,
	#[serde(rename = "AuthorizedPlugins")]
	pub authorized_plugins: AuthorizedPluginsList,
}

#[derive(Deserialize)]
pub struct AuthorizedPlugin {
	#[serde(rename = "allowedPermissions")]
	pub allowed_permissions: HashSet<Permission>,
}

#[derive(Deserialize)]
pub struct AuthorizedPluginsList {
	#[serde(rename = "allowedPlugins")]
	pub allowed_plugins: HashMap<String, AuthorizedPlugin>,
	#[serde(rename = "blockedPlugins")]
	pub blocked_plugins: HashSet<String>,
}

#[derive(Deserialize)]
pub struct AppSettings {
	pub plugins: SettingsPlugin,
}

#[derive(Deserialize)]
pub struct SettingsPlugin {
	pub copy: bool,
	pub download: bool,
	pub proxy: bool,
}

// http
#[derive(Serialize)]
pub struct ErrorResponse {
	pub error: String,
}

#[derive(Serialize)]
pub struct OkResponse {
	pub ok: bool,
}
