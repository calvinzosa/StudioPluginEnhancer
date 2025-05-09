import { useEffect, useState } from 'react';
import { Store } from '@tauri-apps/plugin-store';

import { DefaultAuthorizedPluginsList, AuthorizedPlugin, AuthorizedPluginsList } from '../types';
import { useRefreshTrigger } from './useRefreshTrigger';

export function usePluginsList(store: Store | null, ver?: number): [Array<AuthorizedPlugin>, Array<string>, () => void] {
	const [version, refresh] = useRefreshTrigger();
	
	const [allowedPlugins, setAllowedPlugins] = useState<Array<AuthorizedPlugin>>([]);
	const [blockedPlugins, setBlockedPlugins] = useState<Array<string>>([]);
	
	useEffect(() => {
		if (store === null) {
			return;
		}
		
		(async () => {
			const serialized = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
			const authorized = Object.values(serialized.allowedPlugins).map(p => ({
				...p,
				requestedPermissions: new Set(p.requestedPermissions),
				allowedPermissions: new Set(p.allowedPermissions),
			}));
			
			setAllowedPlugins(authorized);
			setBlockedPlugins(serialized.blockedPlugins);
		})();
	}, [store, version, ver]);
	
	return [allowedPlugins, blockedPlugins, refresh];
}
