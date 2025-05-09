import { useEffect, useState } from 'react';
import { Store } from '@tauri-apps/plugin-store';
import jsonpack from 'jsonpack';

import { UsageLogs as UsageLogsT, SerializedLog } from '../types';
import { useRefreshTrigger } from './useRefreshTrigger';

export function useUsageLogs(store: Store | null, ver?: number): [Array<SerializedLog> | null, () => void] {
	const [version, refresh] = useRefreshTrigger();
	
	const [logs, setLogs] = useState<Array<SerializedLog> | null>(null);
	
	useEffect(() => {
		if (store === null) {
			return;
		}
		
		(async () => {
			const raw = await store.get<UsageLogsT>('UsageLogs');
			setLogs(raw ? jsonpack.unpack<SerializedLog[]>(raw.encodedLogs) : []);
		})();
	}, [store, version, ver]);
	
	return [logs, refresh];
}
