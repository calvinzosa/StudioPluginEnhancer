import { CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { Store } from '@tauri-apps/plugin-store';

import { AuthorizedPluginsList, DefaultAuthorizedPluginsList } from '../../types';
import { usePluginsList } from '../../hooks/usePluginsList';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useRefreshTrigger } from '../../hooks/useRefreshTrigger';
import Tab, { TabName } from './Tab';
import PluginItem from './PluginItem';

import './index.scss';

interface PluginsManagerProps {
	store: Store | null;
}

const PluginsManager: React.FC<PluginsManagerProps> = ({ store }) => {
	const [version, refresh] = useRefreshTrigger();
	const [allowedPlugins, blockedPlugins] = usePluginsList(store, version);
	const [appSettings] = useAppSettings(store, version);
	
	const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<TabName>('authorized');
	const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({});
	
	const tabRefs = useRef<Map<TabName, HTMLButtonElement>>(new Map());
	
	useLayoutEffect(() => {
		const element = tabRefs.current.get(activeTab);
		if (element === undefined || store === null || appSettings === null) {
			return;
		}
		
		setIndicatorStyle({ left: element.offsetLeft, width: element.offsetWidth });
	}, [activeTab, store, appSettings]);
	
	if (store === null || appSettings === null) {
		return (
			<section className={'pluginsManager'}>
				<h1 className={'loading'}>Loading app storage...</h1>
			</section>
		);
	}
	
	return (
		<section className={'pluginsManager'}>
			<div className={'buttons'}>
				<button
					className={'refresh'}
					onClick={refresh}
				>
					<span className={'material-symbol'}>refresh</span>
					<p>Refresh plugins</p>
				</button>
			</div>
			<div className={'tabs'}>
				<Tab
					text={'Authorized Plugins'}
					tab={'authorized'}
					tabRefs={tabRefs}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
				/>
				<Tab
					text={'Blocked Plugins'}
					tab={'blocked'}
					tabRefs={tabRefs}
					activeTab={activeTab}
					setActiveTab={setActiveTab}
				/>
				<span className={'tabIndicator'} style={indicatorStyle} />
			</div>
			<div className={'plugins'}>
				{activeTab === 'authorized' ? (
					allowedPlugins !== null && allowedPlugins.length > 0 ? allowedPlugins.map((plugin) => (
						<PluginItem
							key={plugin.id}
							store={store}
							appSettings={appSettings}
							plugin={plugin}
							isSelected={plugin.id === selectedPluginId}
							setSelectedPluginId={setSelectedPluginId}
							refresh={refresh}
							updatePlugin={async () => {
								const serializedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
								if (!(plugin.id in serializedPlugins.allowedPlugins)) {
									return;
								}
								
								serializedPlugins.allowedPlugins[plugin.id] = {
									...plugin,
									requestedPermissions: Array.from(plugin.requestedPermissions),
									allowedPermissions: Array.from(plugin.allowedPermissions),
								};
								
								await store.set('AuthorizedPlugins', serializedPlugins);
								refresh();
							}}
						/>
					)) : (
						<h1 className={'none'}>No plugins found</h1>
					)
				) : (
					blockedPlugins.length > 0 ? blockedPlugins.map((pluginId) => (
						<div key={pluginId} className={'plugin blocked'}>
							<div className={'header'}>
								<span className={'material-symbol'}>radio_button_checked</span>
								<p className={'id'}>{pluginId}</p>
								<button
									className={'manage'}
									onClick={async () => {
										const serializedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
										
										const index = serializedPlugins.blockedPlugins.indexOf(pluginId);
										if (index === -1) {
											return;
										}
										
										serializedPlugins.blockedPlugins.splice(index, 1);
										
										await store.set('AuthorizedPlugins', serializedPlugins);
										refresh();
									}}
								>
									<span className={'material-symbol'}>do_not_disturb_on</span>
								</button>
							</div>
						</div>
					)) : (
						<h1 className={'none'}>No plugins found</h1>
					)
				)}
			</div>
		</section>
	);
};

export default PluginsManager;
