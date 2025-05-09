import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { exit } from '@tauri-apps/plugin-process';
import { message } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import jsonpack from 'jsonpack';

import { LogPayload, SerializedLog, ShutdownPayload, UsageLogs } from './types';
import { loadStore, store, waitUntilLoaded } from './store';
import { debounce } from './utils';
import { initTray } from './tray';
import App from './components/App';

let encodedLogs: string | null = null;

(async () => {
	const store = await waitUntilLoaded();
	const usageLogs = await store.get<UsageLogs>('UsageLogs');
	if (usageLogs !== undefined) {
		encodedLogs = usageLogs.encodedLogs;
	} else {
		encodedLogs = jsonpack.pack([]);
	}
})();

const saveLogs = debounce(async () => {
	if (encodedLogs === null || store === null) {
		return;
	}
	
	await store.set('UsageLogs', { encodedLogs } as UsageLogs);
}, 1_000);

listen<ShutdownPayload>('shutdown', async (event) => {
	await message(
		`Failed to start HTTP server on backend, please restart the app\nError: ${event.payload.error}`,
		{ title: 'Studio Plugin Enhancer', kind: 'error' },
	);
	
	await exit(1);
});

listen<LogPayload>('log', async (event) => {
	if (encodedLogs === null) {
		return;
	}
	
	const payload = event.payload;
	const serializedLog: SerializedLog = [payload.pluginId, payload.performed, payload.data, Math.round(Date.now())];
	
	const logs = jsonpack.unpack<Array<SerializedLog>>(encodedLogs);
	logs.push(serializedLog);
	
	encodedLogs = jsonpack.pack(logs);
	
	saveLogs();
});

const element = document.getElementById('root')!;
const root = ReactDOM.createRoot(element);
root.render(
	<React.StrictMode>
		<HashRouter>
			<App />
		</HashRouter>
	</React.StrictMode>
);

initTray();
loadStore();
