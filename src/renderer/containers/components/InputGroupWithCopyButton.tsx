import { useState } from 'react';
import {
  Button,
  InputGroup,
  Input,
  Tooltip,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface InputGroupWithCopyButtonProps {
  id: string | number;
  className?: string;
  inputClassName?: string;
  name: string;
  value: string;
  message?: string;
  multiLine?: boolean;
  darkMode?: boolean;
}

function InputGroupWithCopyButton({
  id: idFromProps,
  className = '',
  inputClassName = '',
  name,
  value,
  message = 'Copied!',
  multiLine = false,
  darkMode = false,
}: InputGroupWithCopyButtonProps) {
  const [tooltipState, setTooltipState] = useState(false);

  const handleTooltipTargetClick = async () => {
    setTooltipState(true);
    await window.electronAPI.copy(value);

    setTimeout(() => {
      setTooltipState(false);
    }, 3000);
  };

  const id = `icon-${idFromProps}`;

  return (
    <InputGroup className={className}>
      <Input
        className={`form-control ${inputClassName}`}
        id={name}
        name={name}
        disabled
        type={multiLine ? 'textarea' : 'text'}
        value={value}
      />
      <Button
        onClick={handleTooltipTargetClick}
        id={id}
        outline={!darkMode}
        color="secondary"
      >
        <Tooltip
          autohide
          container="#root"
          isOpen={tooltipState}
          placement="top"
          target={id}
        >
          {message}
        </Tooltip>
        <FontAwesomeIcon icon={['far', 'copy']} />
      </Button>
    </InputGroup>
  );
}

export default InputGroupWithCopyButton;
