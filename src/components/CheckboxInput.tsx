import './CheckboxInput.scss';

interface CheckboxInputProps extends React.PropsWithChildren {
	checked: boolean;
	defaultChecked?: boolean;
	disabled?: boolean;
	onChange(checked: boolean): void;
}

const CheckboxInput: React.FC<CheckboxInputProps> = ({ checked, defaultChecked, disabled, onChange, children }) => {
	return (
		<div className={'checkbox' + (disabled ? ' disabled' : '')}>
			<label className={'switch'}>
				<input type={'checkbox'} checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
				<span className={'slider'} />
			</label>
			{children}
			{defaultChecked !== undefined && defaultChecked !== checked && (
				<button
					className={'modified'}
					title={'Reset to default'}
					onClick={() => onChange(defaultChecked)}
				>
					<span className={'material-symbol'}>emergency</span>
				</button>
			)}
		</div>
	);
};

export default CheckboxInput;
