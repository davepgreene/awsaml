import {
	useState,
	useRef,
	ChangeEvent,
	KeyboardEvent,
	MouseEvent,
} from 'react';
import styled from 'styled-components';
import { InputGroup, Input, ListGroupItem, Button, Collapse } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier } from 'dnd-core';
import { BORDER_COLOR_SCHEME_MEDIA_QUERY } from '../../constants/styles';
import InputGroupWithCopyButton from '../components/InputGroupWithCopyButton';

const ProfileInputGroup = styled(InputGroup)`
  width: 100%;
  height: 2.5em;
  line-height: 2.5em;
`;

const TransparentlistGroupItem = styled(ListGroupItem)`
  background-color: transparent;
  ${BORDER_COLOR_SCHEME_MEDIA_QUERY}
`;

const PaddedCollapse = styled(Collapse)`
  margin-top: 0.4rem;
`;

const LoginType = 'login';

interface DragItem {
	index: number;
}

interface LoginProps {
	url: string;
	pretty?: string;
	profileUuid: string;
	deleteCallback: (payload: { profileUuid: string }) => void;
	errorHandler: (error: string) => void;
	darkMode: boolean;
	index: number;
	moveLogin: (dragIndex: number, hoverIndex: number) => void;
}

function Login({
	url,
	pretty = '',
	profileUuid,
	deleteCallback,
	errorHandler,
	darkMode,
	index,
	moveLogin,
}: LoginProps) {
	const [profileName, setProfileName] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [caretDirection, setCaretDirection] = useState<'right' | 'down'>(
		'right',
	);

	const ref = useRef<HTMLDivElement>(null);

	const [{ handlerId }, drop] = useDrop<
		DragItem,
		void,
		{ handlerId: Identifier | null }
	>({
		accept: LoginType,
		collect(monitor) {
			return { handlerId: monitor.getHandlerId() };
		},
		hover(item, monitor) {
			if (!ref.current) return;
			const dragIndex = item.index;
			const hoverIndex = index;
			if (dragIndex === hoverIndex) return;

			const hoverBoundingRect = ref.current.getBoundingClientRect();
			const hoverMiddleY =
				(hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
			const clientOffset = monitor.getClientOffset();
			if (!clientOffset) return;
			const hoverClientY = clientOffset.y - hoverBoundingRect.top;

			if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
			if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

			moveLogin(dragIndex, hoverIndex);
			item.index = hoverIndex;
		},
	});

	const [{ isDragging }, drag] = useDrag(() => ({
		type: LoginType,
		item: { index },
		collect: (monitor) => ({ isDragging: monitor.isDragging() }),
	}));

	const handleInputChange = ({
		target: { value },
	}: ChangeEvent<HTMLInputElement>) => {
		setProfileName(value);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.keyCode !== 32) return;
		event.preventDefault();
		(event.currentTarget as HTMLInputElement).value += ' ';
	};

	const handleSubmit = async (event: MouseEvent) => {
		event.preventDefault();

		const { error, redirect } = await window.electronAPI.login({
			metadataUrl: url,
			profileName: profileName || pretty,
			profileUuid,
		});

		if (error) errorHandler(error);
		if (redirect) document.location.replace(redirect);
	};

	const handleDelete = async (event: MouseEvent) => {
		event.preventDefault();

		const text = `Are you sure you want to delete the profile "${profileName || pretty}"?`;
		if (window.confirm(text)) {
			await window.electronAPI.deleteProfile({ profileUuid });
			deleteCallback({ profileUuid });
		}
	};

	const handleCollapse = () => {
		setCaretDirection(caretDirection === 'right' ? 'down' : 'right');
		setIsOpen(!isOpen);
	};

	const opacity = isDragging ? 0 : 1;
	drag(drop(ref));

	return (
		<div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
			<TransparentlistGroupItem key={url}>
				<ProfileInputGroup>
					<Button onClick={handleCollapse} outline={!darkMode}>
						<FontAwesomeIcon
							icon={[
								'fas',
								caretDirection === 'right' ? 'caret-right' : 'caret-down',
							]}
						/>
					</Button>
					<Input
						className="form-control"
						defaultValue={pretty}
						name="profileName"
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						type="text"
					/>
					<Button color="secondary" onClick={handleSubmit} outline={!darkMode}>
						Login
					</Button>
					<Button color="danger" onClick={handleDelete} outline={!darkMode}>
						<FontAwesomeIcon icon={['far', 'trash-alt']} />
					</Button>
				</ProfileInputGroup>
				<PaddedCollapse isOpen={isOpen}>
					<InputGroupWithCopyButton
						id={profileUuid}
						name={pretty}
						value={url}
						darkMode={darkMode}
					/>
				</PaddedCollapse>
			</TransparentlistGroupItem>
		</div>
	);
}

export default Login;
