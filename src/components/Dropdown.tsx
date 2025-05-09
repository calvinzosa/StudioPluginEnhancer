import { useEffect, useRef, useState } from 'react';

import './Dropdown.scss';

interface DropdownProps {
	title: string;
	index: number;
	setIndex: React.Dispatch<React.SetStateAction<number>>;
	array: Array<any>;
}

const Dropdown: React.FC<DropdownProps> = ({ title, index, setIndex, array }) => {
	const [active, setActive] = useState<boolean>(false);
	
	const containerRef = useRef<HTMLDivElement>(null);
	
	useEffect(() => {
		const container = containerRef.current;
		if (!active || container === null) {
			return;
		}
		
		const mouseListener = (event: MouseEvent) => {
			if (event.target === container || container.contains(event.target as Node)) {
				return;
			}
			
			if (event.buttons === 1) {
				setActive(false);
			}
		};
		
		document.addEventListener('mousedown', mouseListener);
		
		return () => {
			document.removeEventListener('mousedown', mouseListener);
		};
	}, [active]);
	
	return (
		<div ref={containerRef} className={'dropdownContainer'}>
			<button
				className={'header' + (active ? ' active' : '')}
				onClick={() => setActive(!active)}
			>
				<label>{title}</label>
				<p>{array[index]}</p>
			</button>
			<div className={'dropdownItems' + (active ? ' active' : '')}>
				{array.map((value, i) => (
					<button
						key={i}
						className={'item' + (i === index ? ' active' : '')}
						onClick={() => {
							if (i !== index) {
								setIndex(i);
								setActive(false);
							}
						}}
					>
						<p>{value}</p>
					</button>
				))}
			</div>
		</div>
	);
};

export default Dropdown;
