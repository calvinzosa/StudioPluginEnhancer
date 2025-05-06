import { useEffect, useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { Store } from '@tauri-apps/plugin-store';
import { fetch } from '@tauri-apps/plugin-http';
import { path } from '@tauri-apps/api';
import * as fs from '@tauri-apps/plugin-fs';

import { AuthorizedPluginsList, DefaultAuthorizedPluginsList, InitializeDownloadPayload, RobloxAvatarHeadshots, RobloxUserInfo, SerializedAuthorizedPlugin } from '../types';

import DefaultThumbnail from '/src/assets/DefaultThumbnail-48x.png';

import './DownloadInitializer.scss';
import { formatBytes } from '../utils';

interface DownloadInitializerProps {
	store: Store;
	downloadInfo: InitializeDownloadPayload;
	setDownloadInfo: React.Dispatch<React.SetStateAction<InitializeDownloadPayload | null>>;
}

const DownloadInitializer: React.FC<DownloadInitializerProps> = ({ store, downloadInfo, setDownloadInfo }) => {
	const [userInfo, setUserInfo] = useState<RobloxUserInfo | Error | null>(null);
	const [thumbnailURL, setThumbnailURL] = useState<string | Error | null>(null);
	const [plugin, setPlugin] = useState<SerializedAuthorizedPlugin | null>(null);
	
	useEffect(() => {
		(async () => {
			const authorizedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
			
			const plugin = authorizedPlugins.allowedPlugins[downloadInfo.pluginId];
			if (plugin === undefined) {
				setDownloadInfo(null);
				return;
			}
			
			setPlugin(plugin);
			
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
		})();
	}, []);
	
	const [size, sizeUnit] = formatBytes(downloadInfo.size);
	
	return (
		<section className={'downloadInitializer'}>
			<h1><span className={'material-symbol'}>extension</span> Download Request</h1>
			<div className={'info'}>
				<div className={'name'}>
					<p className={'name'}>{plugin?.name}</p>
					<p className={'id'}>{plugin?.id}</p>
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
				<div className={'confirm'}>
					<p className={'label'}>Are you sure you want to download this file?</p>
				</div>
				<div className={'file'}>
					<p className={'name'}>{downloadInfo.name}</p>
					<p className={'size'}>{size} <span>{sizeUnit}</span></p>
				</div>
				<div className={'actions'}>
					<button
						className={'download'}
						onClick={async () => {
							const newPath = await save({
								title: 'Studio Plugin Enhancer - Download file',
								defaultPath: await path.join(await path.downloadDir(), downloadInfo.name),
								filters: [
									{ name: 'File Type', extensions: [await path.extname(downloadInfo.name)] },
								],
							});
							
							if (newPath === null) {
								return;
							}
							
							await fs.copyFile(downloadInfo.tempPath, newPath);
							await fs.remove(downloadInfo.tempPath);
							
							setDownloadInfo(null);
						}}
					>
						<span className={'material-symbol'}>download</span>
						Download
					</button>
					<button
						className={'block'}
						onClick={async () => {
							await fs.remove(downloadInfo.tempPath);
							
							setDownloadInfo(null);
						}}
					>
						<span className={'material-symbol'}>block</span>
						Ignore
					</button>
				</div>
			</div>
		</section>
	);
};

export default DownloadInitializer;
