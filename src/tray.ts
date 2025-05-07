import { defaultWindowIcon } from '@tauri-apps/api/app';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import * as autostart from '@tauri-apps/plugin-autostart';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { exit } from '@tauri-apps/plugin-process';
import { TrayIcon } from '@tauri-apps/api/tray';
import { Image } from '@tauri-apps/api/image';
import { Menu } from '@tauri-apps/api/menu';

import { AppSettings, DefaultAppSettings } from './types';
import { getBuildEnvironment } from './utils';
import { store, waitUntilLoaded } from './store';

import LogoIcon from '/src/assets/StudioPluginEnhancer-32x.png';
import ToggleIcon from '/src/assets/ToggleIcon-32x.png';
import QuitIcon from '/src/assets/QuitIcon-32x.png';

const urlToImage = async (url: string) => {
	return await fetch(url).then((response) => response.blob()).then((blob) => blob.arrayBuffer()).then((bytes) => Image.fromBytes(bytes));
};

export async function initTray() {
	const store = await waitUntilLoaded();
	const appSettings = await store.get<AppSettings>('AppSettings') ?? DefaultAppSettings;
	
	await updateStartupSetting(appSettings.app.runOnStartup);
	
	const windowIcon = await defaultWindowIcon() as Image;
	const logoIcon = await urlToImage(LogoIcon);
	const toggleIcon = await urlToImage(ToggleIcon);
	const quitIcon = await urlToImage(QuitIcon);
	
	const webviewWindow = getCurrentWebviewWindow();
	if (!appSettings.app.startInBackground) {
		await webviewWindow.show();
	}
	
	const hide = async () => {
		await webviewWindow.hide();
	};
	
	const show = async () => {
		await webviewWindow.show();
		await webviewWindow.setFocus();
	};
	
	const toggle = async () => {
		if (await webviewWindow.isVisible()) {
			await hide();
		} else {
			await show();
		}
	};
	
	const trayMenu = await Menu.new({
		items: [
			{ text: 'Studio Plugin Enhancer', icon: logoIcon },
			{ item: 'Separator' },
			{ text: 'Toggle window', icon: toggleIcon, action: toggle },
			{ text: 'Full quit', icon: quitIcon, action: promptFullQuit },
		],
	});
	
	const existingTrayIcon = await TrayIcon.getById('StudioPluginEnhancer');
	if (existingTrayIcon !== null) {
		await existingTrayIcon.setVisible(false);
		await TrayIcon.removeById('StudioPluginEnhancer');
	}
	
	await TrayIcon.new({
		id: 'StudioPluginEnhancer',
		icon: windowIcon,
		menu: trayMenu,
		showMenuOnLeftClick: false,
		tooltip: 'Studio Plugin Enhancer',
		action(event) {
			if (event.type === 'Click' && event.button === 'Left' && event.buttonState === 'Up') {
				toggle();
			}
		},
	});
	
	webviewWindow.onCloseRequested(async (event) => {
		event.preventDefault();
		await hide();
	});
}

export async function updateStartupSetting(startOnStartup: boolean) {
	const buildEnvironment = getBuildEnvironment();
	if (startOnStartup && buildEnvironment !== 'development') {
		if (!(await autostart.isEnabled())) {
			await autostart.enable();
		}
	} else {
		if (startOnStartup) {
			message('Run app on startup will not work in a development build, disable this', { title: 'Studio Plugin Enhancer', kind: 'warning' });
		}
		
		if (await autostart.isEnabled()) {
			await autostart.disable();
		}
	}
}

export async function promptFullQuit() {
	const appSettings = await store?.get<AppSettings>('AppSettings') ?? DefaultAppSettings;
	
	let yes = true;
	if (appSettings.app.promptFullQuit) {
		yes = await ask(
			'This will kill the entire process and will stop running in the background, are you sure you want to perform a full quit?\n(To run in the background, simply close the window)',
			{ title: 'Studio Plugin Enhancer', kind: 'warning' },
		);
	}
	
	if (yes) {
		await exit(0);
	}
}
