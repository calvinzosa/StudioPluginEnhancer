import { load, Store } from '@tauri-apps/plugin-store';

import { AppSettings, AuthorizedPluginsList, DefaultAppSettings, DefaultAuthorizedPluginsList } from './types';

export let store: Store | null = null;

export async function waitUntilLoaded() {
	return new Promise<Store>((resolve) => {
		const interval = setInterval(() => {
			if (store !== null) {
				clearInterval(interval);
				resolve(store);
			}
		}, 500);
	});
}

export async function loadStore() {
	store = await load('Config.json', { autoSave: true });
	
	if (await store.get<AppSettings>('AppSettings') === undefined) {
		await store.set('AppSettings', DefaultAppSettings);
	}
	
	if (await store.get<AuthorizedPluginsList>('AuthorizedPlugins') === undefined) {
		await store.set('AuthorizedPlugins', DefaultAuthorizedPluginsList);
	}
}
