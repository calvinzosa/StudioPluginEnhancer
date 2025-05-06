import { useEffect, useState } from 'react';
import { Store } from '@tauri-apps/plugin-store';

import { AppSettings, DefaultAppSettings, SettingLabels } from '../types';
import { updateStartupSetting } from '../tray';
import CheckboxInput from './CheckboxInput';

import './SettingsPage.scss';

interface SettingsPageProps {
	store: Store | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ store }) => {
	const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
	
	useEffect(() => {
		if (store === null) {
			return;
		}
		
		(async () => {
			const savedAppSettings = await store.get<AppSettings>('AppSettings') ?? DefaultAppSettings;
			setAppSettings(savedAppSettings);
		})();
	}, [store]);
	
	useEffect(() => {
		if (store === null || appSettings === null) {
			return;
		}
		
		store.set('AppSettings', appSettings);
	}, [store, appSettings]);
	
	useEffect(() => {
		if (appSettings === null) {
			return;
		}
		
		updateStartupSetting(appSettings.app.runOnStartup);
	}, [appSettings?.app.runOnStartup]);
	
	if (store === null || appSettings === null) {
		return (
			<section className={'settingsPage'}>
				<h1 className={'loading'}>Loading app storage...</h1>
			</section>
		);
	}
	
	return (
		<section className={'settingsPage'}>
			<div className={'header'}>
				<span className={'material-symbol'}>filter_none</span>
				<h2>Main Settings</h2>
			</div>
			{Object.entries(appSettings.app).map(([id, toggled]) => (
				<CheckboxInput
					key={id}
					defaultChecked={DefaultAppSettings.app[id as keyof AppSettings['app']]}
					checked={toggled}
					onChange={(newValue) => setAppSettings({ ...appSettings, app: { ...appSettings.app, [id]: newValue } })}
				>
					<p>{id in SettingLabels ? SettingLabels[id as keyof AppSettings['app']] : '#' + id}</p>
				</CheckboxInput>
			))}
			<div className={'hr'} />
			<div className={'header'}>
				<span className={'material-symbol'}>public</span>
				<h2>Global Plugin Permissions</h2>
			</div>
			{Object.entries(appSettings.plugins).map(([id, toggled]) => (
				<CheckboxInput
					key={id}
					defaultChecked={DefaultAppSettings.plugins[id as keyof AppSettings['plugins']]}
					checked={toggled}
					onChange={(newValue) => setAppSettings({ ...appSettings, plugins: { ...appSettings.plugins, [id]: newValue } })}
				>
					<p>{id in SettingLabels ? SettingLabels[id as keyof AppSettings['plugins']] : id}</p>
				</CheckboxInput>
			))}
		</section>
	);
};

export default SettingsPage;
