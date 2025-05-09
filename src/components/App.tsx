import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Store } from '@tauri-apps/plugin-store';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { app } from '@tauri-apps/api';

import { AuthorizedPluginsList, AuthorizedPluginPayload, DefaultAuthorizedPluginsList, InitializeDownloadPayload } from '../types';
import { getBuildEnvironment } from '../utils';
import { waitUntilLoaded } from '../store';
import { promptFullQuit } from '../tray';
import PluginAuthorization from './PluginAuthorization';
import DownloadInitializer from './DownloadInitializer';
import PluginsManager from './PluginsManager';
import SettingsPage from './SettingsPage';
import UsageLogs from './UsageLogs';
import DebugPage from './DebugPage';

import Logo from '/src/assets/StudioPluginEnhancer-512x.png';

import './App.scss';

const App: React.FC = () => {
	const location = useLocation();
	
	const [appVersion, setAppVersion] = useState<string>('X.Y.Z');
	const [tauriVersion, setTauriVersion] = useState<string>('X.Y.Z');
	const [store, setStore] = useState<Store | null>(null);
	
	const [authPlugin, setAuthPlugin] = useState<AuthorizedPluginPayload | null>(null);
	const [downloadInfo, setDownloadInfo] = useState<InitializeDownloadPayload | null>(null);
	
	const buildEnvironment = getBuildEnvironment();
	
	useEffect(() => {
		let unlistenAuthorize: UnlistenFn | null = null;
		let unlistenDownload: UnlistenFn | null = null;
		
		(async () => {
			const store = await waitUntilLoaded();
			setStore(store);
			
			setAppVersion(await app.getVersion());
			setTauriVersion(await app.getTauriVersion());
			
			unlistenAuthorize = await listen<AuthorizedPluginPayload>('plugin_authorize', async (event) => {
				const plugin = event.payload;
				
				const authorizedPlugins = await store.get<AuthorizedPluginsList>('AuthorizedPlugins') ?? DefaultAuthorizedPluginsList;
				if (authorizedPlugins.blockedPlugins.includes(plugin.id)) {
					console.log(`attempted to authorize plugin '${plugin.id}': plugin is blocked by user`);
					return;
				}
				
				const webviewWindow = getCurrentWebviewWindow();
				
				await webviewWindow.show();
				await webviewWindow.setFocus();
				
				setAuthPlugin(plugin);
				
				console.log(`authorizing plugin '${plugin.id}': initialized`);
			});
			
			unlistenDownload = await listen<InitializeDownloadPayload>('initialize_download', async (event) => {
				const downloadInfo = event.payload;
				console.log('downloadInfo =', downloadInfo);
				
				const webviewWindow = getCurrentWebviewWindow();
				
				await webviewWindow.show();
				await webviewWindow.setFocus();
				
				setDownloadInfo(downloadInfo);
				
				console.log(`initializing download info for '${downloadInfo.pluginId}'`);
			});
		})();
		
		return () => {
			setStore(null);
			unlistenAuthorize?.();
			unlistenDownload?.();
		}
	}, []);
	
	return (
		<main>
			<div className={'topbar'} data-tauri-drag-region>
				<div className={'logo'}>
					<img src={Logo} />
					<h1>Studio Plugin Enhancer</h1>
				</div>
				<div className={'controls'}>
					<button className={'minimize'} onClick={() => getCurrentWebviewWindow().minimize()}>
						<span>&#xe921;</span>
					</button>
					<button className={'maximize'} disabled>
						<span>&#xe922;</span>
					</button>
					<button className={'close'} onClick={() => getCurrentWebviewWindow().close()}>
						<span>&#xe8bb;</span>
					</button>
				</div>
			</div>
			<div className={'tabs'}>
				<NavLink className={'tab'} to={'/'} end>
					<span className={'material-symbol'}>settings</span>
					<p>App Settings</p>
				</NavLink>
				<NavLink className={'tab'} to={'/pluginsManager'} end>
					<span className={'material-symbol'}>key</span>
					<p>Manage Plugins</p>
				</NavLink>
				<NavLink className={'tab'} to={'/usageLogs'} end>
					<span className={'material-symbol'}>history</span>
					<p>Usage Logs</p>
				</NavLink>
				{buildEnvironment === 'development' && (
					<NavLink className={'tab'} to={'/debug'} end>
						<span className={'material-symbol'}>bug_report</span>
						<p>Debug</p>
					</NavLink>
				)}
				<div className={'space'} />
				<a
					className={'tab quit'}
					onClick={(event) => {
						event.preventDefault();
						promptFullQuit();
					}}
				>
					<span className={'material-symbol'}>logout</span>
					<p>Quit App</p>
				</a>
			</div>
			<div className={'buildInfo'}>
				<p className={'build'}>Build: <span>{buildEnvironment}</span></p>
				<p className={'version'}>SPE <span>v{appVersion}</span> built with <span>Tauri {tauriVersion}</span></p>
			</div>
			<div className={'content'}>
				<Routes>
					<Route path={'/'} element={<SettingsPage store={store} />} />
					<Route path={'/pluginsManager'} element={<PluginsManager store={store} />} />
					<Route path={'/usageLogs'} element={<UsageLogs store={store} />} />
					<Route path={'/debug'} element={<DebugPage />} />
					<Route path={'/*'} element={(
						<section>
							<h1 className={'loading'}>404 Not Found</h1>
							<h3 className={'hash'}>{location.pathname}</h3>
						</section>
					)} />
				</Routes>
				{authPlugin !== null && store !== null && (
					<PluginAuthorization store={store} plugin={authPlugin} setPlugin={setAuthPlugin} />
				)}
				{downloadInfo !== null && store !== null && (
					<DownloadInitializer store={store} downloadInfo={downloadInfo} setDownloadInfo={setDownloadInfo} />
				)}
			</div>
		</main>
	);
};

export default App;
