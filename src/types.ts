export interface AuthorizedPlugin {
	name: string;
	id: string;
	author: number;
	requestedPermissions: Set<keyof AppSettings['plugins']>;
	allowedPermissions: Set<keyof AppSettings['plugins']>;
}

export interface SerializedAuthorizedPlugin {
	name: string;
	id: string;
	author: number;
	requestedPermissions: Array<keyof AppSettings['plugins']>;
	allowedPermissions: Array<keyof AppSettings['plugins']>;
}

export interface AuthorizedPluginPayload {
	name: string;
	id: string;
	author: number;
	requestedPermissions: Array<keyof AppSettings['plugins']>;
}

export interface InitializeDownloadPayload {
	name: string;
	tempPath: string;
	pluginId: string;
	size: number;
}

export interface ShutdownPayload {
	error: string;
}

export interface RobloxUserInfo {
	description: string;
	created: string;
	isBanned: boolean;
	externalAppDisplayName: string | null;
	hasVerfiedBadge: boolean;
	id: number;
	name: string;
	displayName: string;
}

export interface RobloxAvatarHeadshots {
	data: Array<{
		targetId: number;
		state: 'Error' | 'Completed' | 'InReview' | 'Pending' | 'Blocked' | 'TemporarilyUnavailable';
		imageUrl: string;
		version: string;
	}>;
}

export interface AuthorizedPluginsList {
	allowedPlugins: Record<string, SerializedAuthorizedPlugin>;
	blockedPlugins: Array<string>;
}

export const DefaultAuthorizedPluginsList: AuthorizedPluginsList = {
	allowedPlugins: {},
	blockedPlugins: [],
};

export interface AppSettings {
	app: {
		runOnStartup: boolean;
		startInBackground: boolean;
		promptFullQuit: boolean;
	};
	plugins: {
		copy: boolean;
		download: boolean;
		proxy: boolean;
	};
}

export const DefaultAppSettings: AppSettings = {
	app: {
		runOnStartup: true,
		startInBackground: true,
		promptFullQuit: true,
	},
	plugins: {
		copy: true,
		download: false,
		proxy: true,
	},
};

type SettingNames = { [K in keyof AppSettings]: keyof AppSettings[K] }[keyof AppSettings];

export const SettingLabels: Record<SettingNames, string> = {
	runOnStartup: 'Run app on startup',
	startInBackground: 'Start app in background',
	promptFullQuit: 'Prompt full quit',
	copy: 'Copy text to clipboard',
	download: 'Download files',
	proxy: 'Proxy for requests to Roblox API',
};
