import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalSize } from '@tauri-apps/api/dpi';

import './DebugPage.scss';

const DebugPage: React.FC = () => {
	return (
		<section>
			<button
				onClick={() => getCurrentWebviewWindow().setSize(new LogicalSize(1300, 750))}
			>
				Reset window size to default
			</button>
			<button
				onClick={() => getCurrentWebviewWindow().center()}
			>
				Center window
			</button>
			<button
				onClick={() => location.reload()}
			>
				Refresh page
			</button>
		</section>
	);
};

export default DebugPage;
