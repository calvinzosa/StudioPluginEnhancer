import { Store } from '@tauri-apps/plugin-store';

import { AppSettings, AuthorizedPlugin, AuthorizedPluginsList, DefaultAuthorizedPluginsList, SettingLabels } from '../../types';
import CheckboxInput from '../CheckboxInput';

interface PluginItemProps {
	store: Store;
	appSettings: AppSettings;
	plugin: AuthorizedPlugin;
	isSelected: boolean;
	setSelectedPluginId: React.Dispatch<React.SetStateAction<string | null>>;
	updatePlugin(): void;
	refresh(): void;
}

const PluginItem: React.FC<PluginItemProps> = ({ store, appSettings, plugin, isSelected, updatePlugin, setSelectedPluginId, refresh }) => {
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
							
							refresh();
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
							refresh();
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

export default PluginItem;
