export function getBuildEnvironment(): 'development' | 'production' {
	return window.location.origin === 'http://localhost:1420' ? 'development' : 'production';
}

export function formatBytes(bytes: number): [string, string] {
	const kilobyte = 1024;
	const megabyte = 1024 * 1024;
	const gigabyte = 1024 * 1024 * 1024;
	
	let value = bytes / kilobyte;
	let unit = 'KB';
	if (bytes >= gigabyte) {
		value = bytes / gigabyte;
		unit = 'GB';
	} else if (bytes >= megabyte) {
		value = bytes / megabyte;
		unit = 'MB';
	}
	
	return [value.toFixed(2), unit];
}
