import { useEffect, useState } from 'react';
import { Store } from '@tauri-apps/plugin-store';
import { fetch } from '@tauri-apps/plugin-http';

import { AuthorizedPluginsList, AuthorizedPluginPayload, DefaultAuthorizedPluginsList, RobloxAvatarHeadshots, RobloxUserInfo, SerializedAuthorizedPlugin } from '../types';

import DefaultThumbnail from '/src/assets/DefaultThumbnail-48x.png';

import './PluginAuthorization.scss';

interface PluginAuthorizationProps {
	store: Store;
	plugin: AuthorizedPluginPayload;
	setPlugin: React.Dispatch<React.SetStateAction<AuthorizedPluginPayload | null>>;
}

const PluginAuthorization: React.FC<PluginAuthorizationProps> = ({ store, plugin, setPlugin }) => {
	const [userInfo, setUserInfo] = useState<RobloxUserInfo | Error | null>(null);
	const [thumbnailURL, setThumbnailURL] = useState<string | Error | null>(null);
	
	useEffect(() => {
		fetch('https://users.roblox.com/v1/users/' + plugin.author, { method: 'GET' })
			.then((response) => response.json())
			.then((info: RobloxUserInfo) => setUserInfo(info))
			.catch((err) => setUserInfo(err instanceof Error ? err : new Error(String(err))));
		
		const params = new URLSearchParams();
		params.set('userIds', plugin.author.toString());
		params.set('format', 'Png');
		params.set('size', '60x60');
		params.set('isCircular', 'true');
		
		fetch('https://thumbnails.roblox.com/v1/users/avatar-headshot?' + params.toString(), { method: 'GET' })
			.then((response) => response.json())
			.then((headshots: RobloxAvatarHeadshots) => {
				for (const info of headshots.data) {
					if (info.state === 'Completed' && info.targetId === plugin.author) {
						setThumbnailURL(info.imageUrl);
						return;
					}
				}
				
				setThumbnailURL(new Error('Headshot was not found'))
			})
			.catch((err) => setUserInfo(err instanceof Error ? err : new Error(String(err))));
	}, []);
	
	const serializedPlugin = {
		...plugin,
		requestedPermissions: plugin.requestedPermissions,
		allowedPermissions: plugin.requestedPermissions,
	} as SerializedAuthorizedPlugin;
	
	return (
		<section className={'pluginAuthorization'}>
			<h1><span className={'material-symbol'}>extension</span> Plugin Authorization</h1>
			<div className={'info'}>
				<div className={'name'}>
					<p className={'name'}>{plugin.name}</p>
					<p className={'id'}>{plugin.id}</p>
				</div>
				<div className={'user'}>
					{thumbnailURL === null || thumbnailURL instanceof Error ? (
						<img className={'thumbnail'} src={DefaultThumbnail} />
					) : (
						<img className={'thumbnail'} src={thumbnailURL} />
					)}
					{userInfo === null ? (
						<p className={'name'}>DisplayName <span className={'displayName'}>(@UserName)</span></p>
					) : userInfo instanceof Error ? (
						<p className={'error'}>Failed to load user due to error: {userInfo.message}</p>
					) : (
						<p className={'name'}>{userInfo.displayName} <span className={'displayName'}>(@{userInfo.name})</span></p>
					)}
				</div>
				<div className={'actions'}>
					<button
						className={'authorize'}
						onClick={async () => {
							const authorizedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
							
							authorizedPlugins.allowedPlugins[plugin.id] = serializedPlugin;
							await store.set('AuthorizedPlugins', authorizedPlugins);
							
							setPlugin(null);
						}}
					>
						<span className={'material-symbol'}>check_circle</span>
						Authorize
					</button>
					<button
						className={'block'}
						onClick={async () => {
							const authorizedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
							
							if (!authorizedPlugins.blockedPlugins.includes(plugin.id)) {
								authorizedPlugins.blockedPlugins.push(plugin.id);
							}
							
							await store.set('AuthorizedPlugins', authorizedPlugins);
							
							setPlugin(null);
						}}
					>
						<span className={'material-symbol'}>block</span>
						Block
					</button>
				</div>
			</div>
		</section>
	);
};

export default PluginAuthorization;

