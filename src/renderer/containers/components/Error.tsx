import { Alert } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ErrorProps {
  error?: string;
  metadataUrlValid?: boolean;
}

function Error({ error = '', metadataUrlValid = true }: ErrorProps) {
  return (error || metadataUrlValid === false) ? (
    <Alert color="danger" fade={false}>
      <FontAwesomeIcon icon="exclamation-triangle" />
      {`   ${error}`}
    </Alert>
  ) : null;
}

export default Error;
