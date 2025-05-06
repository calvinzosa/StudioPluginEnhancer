import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Store } from '@tauri-apps/plugin-store';

import { AppSettings, AuthorizedPlugin, AuthorizedPluginsList, DefaultAuthorizedPluginsList, DefaultAppSettings, SettingLabels } from '../types';
import CheckboxInput from './CheckboxInput';

import './PluginsManager.scss';

type TabName = 'authorized' | 'blocked';

interface PluginItem {
	store: Store;
	appSettings: AppSettings;
	plugin: AuthorizedPlugin;
	isSelected: boolean;
	setSelectedPluginId: React.Dispatch<React.SetStateAction<string | null>>;
	updatePlugin(): void;
	nextVersion(): void;
}

const PluginItem: React.FC<PluginItem> = ({ store, appSettings, plugin, isSelected, updatePlugin, setSelectedPluginId, nextVersion }) => {
	if (!isSelected) {
		return (
			<div className={'plugin'}>
				<div className={'header'} onMouseDown={(event) => event.preventDefault()} onClick={() => setSelectedPluginId(plugin.id)}>
					<span className={'material-symbol'}>radio_button_checked</span>
					<p className={'name'}>{plugin.name}</p>
					<p className={'id'}>{plugin.id}</p>
					<button className={'manage'}>
						<span className={'material-symbol'}>arrow_left</span>
					</button>
				</div>
			</div>
		);
	}
	
	return (
		<div className={'plugin selected'}>
			<div className={'header'} onMouseDown={(event) => event.preventDefault()} onClick={() => setSelectedPluginId(null)}>
				<span className={'material-symbol'}>radio_button_unchecked</span>
				<p className={'name'}>{plugin.name}</p>
				<p className={'id'}>{plugin.id}</p>
				<button className={'manage'}>
					<span className={'material-symbol'}>arrow_left</span>
				</button>
			</div>
			<div className={'permissions'}>
				<h1>Requested Permissions</h1>
				{Array.from(plugin.requestedPermissions).map((setting) => (
					<CheckboxInput
						key={setting}
						disabled={!appSettings.plugins[setting]}
						checked={appSettings.plugins[setting] ? plugin.allowedPermissions.has(setting) : false}
						onChange={(checked) => {
							if (!appSettings.plugins[setting]) {
								return;
							}
							
							if (checked) {
								plugin.allowedPermissions.add(setting);
							} else {
								plugin.allowedPermissions.delete(setting);
							}
							
							updatePlugin();
						}}
					>
						<p>{SettingLabels[setting]}</p>
					</CheckboxInput>
				))}
			</div>
			<div className={'actions'}>
				<h1>Actions</h1>
				<div className={'buttons'}>
					<button
						className={'unauthorize'}
						onClick={async () => {
							const authorizedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
							
							if (!(plugin.id in authorizedPlugins.allowedPlugins)) {
								return;
							}
							
							delete authorizedPlugins.allowedPlugins[plugin.id];
							await store.set('AuthorizedPlugins', authorizedPlugins);
							
							nextVersion();
						}}
					>
						<span className={'material-symbol'}>cancel</span>
						<p>Unauthorize</p>
					</button>
					<button
						className={'block'}
						onClick={async () => {
							const authorizedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
							
							if (!(plugin.id in authorizedPlugins.allowedPlugins)) {
								return;
							}
							
							delete authorizedPlugins.allowedPlugins[plugin.id];
							if (!authorizedPlugins.blockedPlugins.includes(plugin.id)) {
								authorizedPlugins.blockedPlugins.push(plugin.id);
							}
							
							await store.set('AuthorizedPlugins', authorizedPlugins);
							nextVersion();
						}}
					>
						<span className={'material-symbol'}>block</span>
						<p>Block</p>
					</button>
				</div>
			</div>
		</div>
	);
};

interface TabProps {
	text: string;
	tab: TabName;
	tabRefs: React.MutableRefObject<Map<TabName, HTMLButtonElement>>;
	activeTab: TabName;
	setActiveTab: React.Dispatch<React.SetStateAction<TabName>>;
}

const Tab: React.FC<TabProps> = ({ text, tab, tabRefs, activeTab, setActiveTab }) => {
	return (
		<button
			ref={(element) => element !== null ? tabRefs.current.set(tab, element) : tabRefs.current.delete(tab)}
			className={'tab' + (activeTab === tab ? ' active' : '')}
			onClick={() => setActiveTab(tab)}
		>
			{text}
		</button>
	);
};

interface PluginsManagerProps {
	store: Store | null;
}

const PluginsManager: React.FC<PluginsManagerProps> = ({ store }) => {
	const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
	const [authorizedPlugins, setAuthorizedPlugins] = useState<Array<AuthorizedPlugin>>([]);
	const [blockedPlugins, setBlockedPlugins] = useState<Array<string>>([]);
	const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
	const [versionId, setVersionId] = useState<number>(0);
	const [activeTab, setActiveTab] = useState<TabName>('authorized');
	const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({});
	
	const tabRefs = useRef<Map<TabName, HTMLButtonElement>>(new Map());
	
	useEffect(() => {
		if (store === null) {
			return;
		}
		
		(async () => {
			const serializedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
			
			const authorizedPlugins = Object.entries(serializedPlugins.allowedPlugins).map(([, serializedPlugin]) => ({
				...serializedPlugin,
				requestedPermissions: new Set(serializedPlugin.requestedPermissions),
				allowedPermissions: new Set(serializedPlugin.allowedPermissions),
			}));
			
			setAuthorizedPlugins(authorizedPlugins);
			setBlockedPlugins(serializedPlugins.blockedPlugins);
			
			const savedAppSettings = await store.get<AppSettings>('AppSettings') ?? DefaultAppSettings;
			setAppSettings(savedAppSettings);
		})();
	}, [store, versionId]);
	
	useLayoutEffect(() => {
		const element = tabRefs.current.get(activeTab);
		if (element === undefined || store === null || appSettings === null) {
			return;
		}
		
		setIndicatorStyle({ left: element.offsetLeft, width: element.offsetWidth });
	}, [activeTab, store, appSettings]);
	
	if (store === null || appSettings === null) {
		return (
			<section className={'settingsPage'}>
				<h1 className={'loading'}>Loading app storage...</h1>
			</section>
		);
	}
	
	return (
		<section className={'pluginsManager'}>
			<div className={'buttons'}>
				<button
					className={'refresh'}
					onClick={() => setVersionId(versionId + 1)}
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
					authorizedPlugins.length > 0 ? authorizedPlugins.map((plugin) => (
						<PluginItem
							key={plugin.id}
							store={store}
							appSettings={appSettings}
							plugin={plugin}
							isSelected={plugin.id === selectedPluginId}
							setSelectedPluginId={setSelectedPluginId}
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
								setVersionId(versionId + 1);
							}}
							nextVersion={() => setVersionId(versionId + 1)}
						/>
					)) : (
						<h2 className={'none'}>No plugins found</h2>
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
										setVersionId(versionId + 1);
									}}
								>
									<span className={'material-symbol'}>do_not_disturb_on</span>
								</button>
							</div>
						</div>
					)) : (
						<h2 className={'none'}>No plugins found</h2>
					)
				)}
			</div>
		</section>
	);
};

export default PluginsManager;
