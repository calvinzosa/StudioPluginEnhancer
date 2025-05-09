import { useCallback, useState } from 'react';

export function useRefreshTrigger(): [number, () => void] {
	const [version, setVersion] = useState<number>(0);
	const refresh = useCallback(() => setVersion((version) => version + 1), []);
	
	return [version, refresh];
}
