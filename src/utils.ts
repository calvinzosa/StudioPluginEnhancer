export function getBuildEnvironment(): 'development' | 'production' {
	return window.location.origin === 'http://localhost:1420' ? 'development' : 'production';
}

export function formatBytes(bytes: number): [string, string] {
	const kilobyte = 1024;
	const megabyte = 1024 * 1024;
	const gigabyte = 1024 * 1024 * 1024;
	
	let value = bytes / kilobyte;
	let unit = 'KiB';
	if (bytes >= gigabyte) {
		value = bytes / gigabyte;
		unit = 'GiB';
	} else if (bytes >= megabyte) {
		value = bytes / megabyte;
		unit = 'MiB';
	}
	
	return [value.toFixed(2), unit];
}

export function debounce<T extends Array<any>>(fn: (...args: T) => void, delay: number): (...args: T) => void {
	let timeoutId: number | undefined = undefined;
	
	return (...args: T) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}
