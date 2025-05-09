export type TabName = 'authorized' | 'blocked';

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

export default Tab;
