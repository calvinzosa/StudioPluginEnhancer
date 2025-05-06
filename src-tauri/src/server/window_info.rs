use crate::server::types::ErrorResponse;
use actix_web::HttpResponse;
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW};

pub fn ensure_roblox_studio_focused() -> Result<(), HttpResponse> {
	unsafe {
		let hwnd = GetForegroundWindow();
		if hwnd.0.is_null() {
			return Err(HttpResponse::Forbidden().json(ErrorResponse { error: "no focused window".into() }));
		}
		
		let length = GetWindowTextLengthW(hwnd);
		if length == 0 {
			return Err(HttpResponse::InternalServerError().json(ErrorResponse { error: "failed to read window title".into() }));
		}
		
		let mut buffer = vec![0u16; (length + 1) as usize];
		let length = GetWindowTextW(hwnd, &mut buffer);
		if length == 0 {
			return Err(HttpResponse::InternalServerError().json(ErrorResponse { error: "failed to read window title".into() }));
		}
		
		let title = match String::from_utf16(&buffer[..length as usize]) {
			Ok(t) => t,
			Err(e) => return Err(HttpResponse::InternalServerError().json(ErrorResponse { error: format!("failed to decode window title: {e}") })),
		};
		
		if title.ends_with(" - Roblox Studio") {
			Ok(())
		} else {
			Err(HttpResponse::Forbidden().json(ErrorResponse { error: "roblox studio is not focused".into() }))
		}
	}
}
