import { useEffect, useState } from 'react';
import { Store } from '@tauri-apps/plugin-store';

import { AppSettings, DefaultAppSettings } from '../types';
import { useRefreshTrigger } from './useRefreshTrigger';

export function useAppSettings(store: Store | null, ver?: number): [AppSettings | null, (newSettings: AppSettings) => void, () => void] {
	const [version, refresh] = useRefreshTrigger();
	
	const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
	
	useEffect(() => {
		if (store === null) {
			return;
		}
		
		(async () => {
			const appSettings = await store.get<AppSettings>('AppSettings') ?? DefaultAppSettings;
			setAppSettings(appSettings);
		})();
	}, [store, version, ver]);
	
	return [appSettings, setAppSettings, refresh];
}
