import { useState } from 'react';
import { Store } from '@tauri-apps/plugin-store';

import { usePluginsList } from '../hooks/usePluginsList';
import { useUsageLogs } from '../hooks/useUsageLogs';
import Dropdown from './Dropdown';

import './UsageLogs.scss';

interface UsageLogsProps {
	store: Store | null;
}

const UsageLogs: React.FC<UsageLogsProps> = ({ store }) => {
	const [pluginsList] = usePluginsList(store);
	const [logs] = useUsageLogs(store);
	
	const [query, setQuery] = useState<string>('');
	const [pluginIndex, setPluginIndex] = useState<number>(0);
	const [actionIndex, setActionIndex] = useState<number>(0);
	
	const actions = ['All', 'Copy', 'Download', 'Legacy API', 'Cloud API'];
	
	if (store === null) {
		return (
			<section className={'usageLogs'}>
				<h1 className={'loading'}>Loading app storage...</h1>
			</section>
		);
	}
	
	const filterPlugin = pluginsList?.[pluginIndex];
	
	let filterPerformed: string | null = null;
	switch (actionIndex) {
		case 1: {
			filterPerformed = 'copy';
			break;
		}
		case 2: {
			filterPerformed = 'download';
			break;
		}
		case 3: {
			filterPerformed = 'legacyApi';
			break;
		}
		case 4: {
			filterPerformed = 'cloudApi';
			break;
		}
	}
	
	let logList: React.ReactElement | null = null;
	if (logs !== null) {
		const list = logs.sort((a, b) => b[3] - a[3]).map(([pluginId, performed, data, timestamp], i) => {
			if ((filterPerformed !== null && performed !== filterPerformed)
				|| (filterPlugin !== undefined && filterPlugin.id !== pluginId)
				|| (query.length > 0 && !data.includes(query))) {
				return null;
			}
			
			const plugin = pluginsList.find((plugin) => plugin.id === pluginId);
			
			const timeString = new Date(timestamp).toLocaleDateString(undefined, {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
				second: '2-digit',
			});
			
			let text: string;
			switch (performed) {
				case 'copy': {
					text = 'Copied text:';
					break;
				}
				case 'download': {
					text = 'Download file:';
					break;
				}
				case 'legacyApi': {
					text = 'Requested to Legacy API:';
					break;
				}
				default: {
					text = performed;
					break;
				}
			}
			
			return (
				<div key={i} className={'log'}>
					<div className={'plugin'}>
						<p className={'name'}>{plugin?.name ?? '[Unknown Plugin]'}</p>
						<p className={'id'}>{pluginId}</p>
						<div className={'space'} />
						<p className={'timestamp'}>{timeString}</p>
					</div>
					<p className={'performed'}>{text}</p>
					<p className={'data'}>{data}</p>
				</div>
			);
		}).filter((value) => value !== null);
		
		if (list.length > 0) {
			logList = (
				<div className={'list'}>
					{list}
				</div>
			);
		} else {
			logList = (
				<h1 className={'loading noneFound'}>No logs found</h1>
			);
		}
	}
	
	return (
		<section className={'usageLogs'}>
			<div className={'filters'}>
				<div className={'search'}>
					<input
						type={'text'}
						value={query}
						onChange={(event) => setQuery(event.currentTarget.value)}
					/>
					<label>Search</label>
					<span className={'material-symbol'}>search</span>
				</div>
				<Dropdown
					title={'Selected Plugin'}
					index={pluginIndex}
					setIndex={setPluginIndex}
					array={pluginsList.length > 0 ? ['All', ...pluginsList.map((plugin) => plugin.id)] : ['None']}
				/>
				<Dropdown
					title={'Action'}
					index={actionIndex}
					setIndex={setActionIndex}
					array={actions}
				/>
			</div>
			{logs === null ? (
				<h1 className={'loading'}>Loading...</h1>
			) : logList}
		</section>
	);
};

export default UsageLogs;
