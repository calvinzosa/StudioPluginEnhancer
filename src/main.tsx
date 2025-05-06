import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { exit } from '@tauri-apps/plugin-process';
import { message } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';

import { ShutdownPayload } from './types';
import { loadStore } from './store';
import { initTray } from './tray';
import App from './components/App';

listen<ShutdownPayload>('shutdown', async (event) => {
	await message(
		`Failed to start HTTP server on backend, please restart the app\nError: ${event.payload.error}`,
		{ title: 'StudioPluginEnhancer', kind: 'error' },
	);
	
	await exit(1);
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

loadStore();
initTray();
